import asyncio
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.db import Campaign, Execution, Task, Finding, Report
from backend.app.agents.campaign_agent import CampaignAgent
from backend.app.agents.url_agent import URLAgent
from backend.app.agents.email_qa_agent import EmailQAAgent
from backend.app.agents.playwright_agent import PlaywrightAgent
from backend.app.agents.repair_agent import RepairAgent
from backend.app.agents.reporting_agent import ReportingAgent
from backend.app.services.playwright_executor import playwright_executor

# Initialize all agents
campaign_agent = CampaignAgent()
url_agent = URLAgent()
email_qa_agent = EmailQAAgent()
playwright_agent = PlaywrightAgent()
repair_agent = RepairAgent()
reporting_agent = ReportingAgent()

class AgentOrchestrator:
    def __init__(self):
        pass

    async def execute_campaign_validation_workflow(
        self, 
        db: Session, 
        campaign_id: str, 
        browser_type: str = "chromium",
        require_approval: bool = False
    ) -> Dict[str, Any]:
        """Runs the complete sequential & parallel agent audit workflow for a campaign."""
        print(f"[Orchestrator] Starting validation workflow for campaign {campaign_id}...")
        
        # 1. Fetch Campaign
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            raise ValueError(f"Campaign with ID {campaign_id} not found.")

        # Create Execution record
        execution = Execution(
            campaign_id=campaign_id,
            trigger_type="Manual",
            browser_type=browser_type,
            status="Running"
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)

        try:
            # --- TASK 1: Campaign Brief Analysis ---
            t1_start = datetime.utcnow()
            task_campaign = Task(
                execution_id=execution.id,
                agent_name=campaign_agent.name,
                task_name="Campaign Requirements Analysis",
                input_data={"campaign_name": campaign.name, "raw_email_assets": campaign.email_assets},
                status="Running"
            )
            db.add(task_campaign)
            db.commit()

            # Mock description combining name and cta
            brief_doc = f"Campaign Name: {campaign.name}\nAudience: {campaign.audience}\nCTA: {campaign.cta}\nLanding Pages: {campaign.landing_pages}\nUTM guidelines: {campaign.utm_parameters}"
            parsed_requirements = campaign_agent.analyze_requirements(brief_doc)
            
            # Update campaign model with parsed data if they were empty
            if not campaign.audience and parsed_requirements.get("audience"):
                campaign.audience = parsed_requirements["audience"]
            if not campaign.cta and parsed_requirements.get("cta"):
                campaign.cta = parsed_requirements["cta"]
            if not campaign.landing_pages and parsed_requirements.get("landing_pages"):
                campaign.landing_pages = parsed_requirements["landing_pages"]
            if not campaign.utm_parameters and parsed_requirements.get("utm_parameters"):
                campaign.utm_parameters = parsed_requirements["utm_parameters"]
            db.commit()

            task_campaign.output_data = parsed_requirements
            task_campaign.status = "Success"
            task_campaign.execution_time_seconds = (datetime.utcnow() - t1_start).total_seconds()
            db.commit()

            # --- TASK 2 & 3: Run URL Crawl & Email QA in PARALLEL ---
            print("[Orchestrator] Spawning parallel audits: URL Validations and Email QA...")
            t2_start = datetime.utcnow()
            task_url = Task(
                execution_id=execution.id,
                agent_name=url_agent.name,
                task_name="Parallel URL Validation Crawl",
                input_data={"urls": campaign.landing_pages, "expected_utms": campaign.utm_parameters},
                status="Running"
            )
            task_qa = Task(
                execution_id=execution.id,
                agent_name=email_qa_agent.name,
                task_name="Parallel Email Asset QA",
                input_data={"subject": campaign.name, "email_body": campaign.email_assets[0] if campaign.email_assets else ""},
                status="Running"
            )
            db.add(task_url)
            db.add(task_qa)
            db.commit()

            # Execute parallel tasks
            url_task_coro = asyncio.to_thread(
                url_agent.validate_urls, 
                urls=campaign.landing_pages, 
                expected_utms=campaign.utm_parameters
            )
            email_task_coro = asyncio.to_thread(
                email_qa_agent.validate_email,
                subject=campaign.name,
                email_body=campaign.email_assets[0] if campaign.email_assets else ""
            )

            url_findings, email_findings = await asyncio.gather(url_task_coro, email_task_coro)

            # Save findings to DB
            all_findings = url_findings + email_findings
            for f in all_findings:
                finding_db = Finding(
                    campaign_id=campaign_id,
                    target_type=f.get("target_type", "URL"),
                    severity=f.get("severity", "Medium"),
                    description=f.get("description", ""),
                    remediation=f.get("remediation", "")
                )
                db.add(finding_db)
            db.commit()

            task_url.output_data = {"findings_count": len(url_findings)}
            task_url.status = "Success"
            task_url.execution_time_seconds = (datetime.utcnow() - t2_start).total_seconds()

            task_qa.output_data = {"findings_count": len(email_findings)}
            task_qa.status = "Success"
            task_qa.execution_time_seconds = (datetime.utcnow() - t2_start).total_seconds()
            db.commit()

            # --- Human Approval Workflow Checkpoint ---
            if require_approval:
                print(f"[Orchestrator] Awaiting human approval before running Playwright scripts for {campaign_id}")
                campaign.status = "Awaiting Approval"
                execution.status = "Success" # Validation successful up to approval
                db.commit()
                return {"status": "AwaitingApproval", "execution_id": execution.id, "findings_count": len(all_findings)}

            # --- TASK 4: Playwright Script Generation & Execution ---
            t4_start = datetime.utcnow()
            task_playwright = Task(
                execution_id=execution.id,
                agent_name=playwright_agent.name,
                task_name="Playwright Test Automation",
                input_data={"landing_pages": campaign.landing_pages, "cta_text": campaign.cta},
                status="Running"
            )
            db.add(task_playwright)
            db.commit()

            # Write standard automation steps
            automation_script = playwright_agent.generate_script(
                campaign_name=campaign.name,
                landing_pages=campaign.landing_pages,
                cta_text=campaign.cta
            )
            
            # Execute browser script
            executor_result = await playwright_executor.execute_campaign_script(
                db=db,
                execution_id=execution.id,
                script_code=automation_script,
                browser_type=browser_type
            )

            # --- TASK 5: Self-Correcting Repair Loop if needed ---
            final_script = automation_script
            if not executor_result["success"]:
                print("[Orchestrator] Test execution failed. Initializing ScriptRepairAgent healing loop...")
                t5_start = datetime.utcnow()
                task_repair = Task(
                    execution_id=execution.id,
                    agent_name=repair_agent.name,
                    task_name="Playwright Script Healing Loop",
                    input_data={"execution_id": execution.id, "original_script": automation_script},
                    status="Running"
                )
                db.add(task_repair)
                db.commit()

                # Trigger healing loop (loops inside up to 3 times)
                # Load latest logs
                log_local = executor_result["log_path"].replace("/static/", f"{settings.STORAGE_DIR}/")
                try:
                    with open(log_local, "r") as f:
                        err_logs = f.read()
                except Exception:
                    err_logs = "Initial run failed with no local logs."

                repair_result = await repair_agent.heal_and_retest(
                    db=db,
                    execution_id=execution.id,
                    original_script=automation_script,
                    error_logs=err_logs,
                    browser_type=browser_type
                )

                task_repair.output_data = {"attempts": repair_result["attempts"]}
                if repair_result["success"]:
                    task_repair.status = "Success"
                    final_script = repair_result["fixed_script"]
                    # Override success parameters
                    executor_result["success"] = True
                    executor_result["video_path"] = repair_result["video_path"]
                    executor_result["screenshots"] = repair_result["screenshots"]
                else:
                    task_repair.status = "Failed"
                
                task_repair.execution_time_seconds = (datetime.utcnow() - t5_start).total_seconds()
                db.commit()

            task_playwright.output_data = {
                "success": executor_result["success"],
                "video_path": executor_result["video_path"],
                "screenshots": executor_result["screenshots"],
                "script_code": final_script
            }
            task_playwright.status = "Success" if executor_result["success"] else "Failed"
            task_playwright.execution_time_seconds = (datetime.utcnow() - t4_start).total_seconds()
            db.commit()

            # --- TASK 6: Reports compilation ---
            print("[Orchestrator] Generating audit PDF, Excel, and HTML summaries...")
            pdf_path = os.path.join(settings.STORAGE_DIR, "reports", f"{campaign_id}.pdf")
            excel_path = os.path.join(settings.STORAGE_DIR, "reports", f"{campaign_id}.xlsx")
            html_path = os.path.join(settings.STORAGE_DIR, "reports", f"{campaign_id}.html")

            reporting_agent.generate_pdf_report(campaign.name, all_findings, pdf_path)
            reporting_agent.generate_excel_report(campaign.name, all_findings, excel_path)
            reporting_agent.generate_html_report(campaign.name, all_findings, html_path)

            # Add reports reference to DB
            for fmt, path in [("PDF", f"/static/reports/{campaign_id}.pdf"), 
                             ("Excel", f"/static/reports/{campaign_id}.xlsx"),
                             ("HTML", f"/static/reports/{campaign_id}.html")]:
                rep_entry = Report(
                    campaign_id=campaign_id,
                    type="CampaignHealth",
                    format=fmt,
                    file_path=path
                )
                db.add(rep_entry)
            
            # Mark campaign status completed
            campaign.status = "Active" if executor_result["success"] else "Failed"
            execution.status = "Success" if executor_result["success"] else "Failed"
            db.commit()

            return {
                "status": "Success" if executor_result["success"] else "Failed",
                "execution_id": execution.id,
                "findings_count": len(all_findings),
                "video_path": executor_result["video_path"],
                "screenshots": executor_result["screenshots"]
            }

        except Exception as e:
            import traceback
            print(f"[Orchestrator] Critical error in campaign pipeline: {e}")
            traceback.print_exc()
            campaign.status = "Failed"
            execution.status = "Failed"
            db.commit()
            return {"status": "Error", "detail": str(e), "execution_id": execution.id}

orchestrator = AgentOrchestrator()
