from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from backend.app.db import get_db, Campaign, Execution
from backend.app.schemas import CopilotQuery
from backend.app.agents.orchestrator import orchestrator
from backend.app.auth import RoleChecker

router = APIRouter(prefix="/agents", tags=["agents"])
auth_checker = RoleChecker(["admin", "campaign_manager", "automation_engineer"])

@router.get("")
async def get_agents_list(current_user: dict = Depends(auth_checker)):
    """Exposes registry of all active agents within the campaign OS system."""
    return [
        {"name": "CampaignAgent", "role": "Requirements Parser", "status": "Idle", "tasks_completed": 12, "accuracy_score": 0.98},
        {"name": "URLAgent", "role": "Link and UTM Auditor", "status": "Idle", "tasks_completed": 45, "accuracy_score": 0.99},
        {"name": "EmailQAAgent", "role": "Email Layout Quality Check", "status": "Idle", "tasks_completed": 30, "accuracy_score": 0.95},
        {"name": "PlaywrightAgent", "role": "Browser Test Generator", "status": "Idle", "tasks_completed": 15, "accuracy_score": 0.92},
        {"name": "RepairAgent", "role": "Self-Healing QA Engineer", "status": "Idle", "tasks_completed": 4, "accuracy_score": 1.0},
        {"name": "CICDAgent", "role": "DevOps Remediator", "status": "Idle", "tasks_completed": 8, "accuracy_score": 0.90},
        {"name": "ReportingAgent", "role": "PDF & Spreadsheets Compiler", "status": "Idle", "tasks_completed": 20, "accuracy_score": 1.0}
    ]

@router.post("/copilot")
async def copilot_chat_command(
    query: CopilotQuery,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth_checker)
):
    """Interprets freeform chat commands and triggers corresponding automation actions."""
    message = query.message.lower().strip()
    
    # 1. Action: Validate Campaign
    if "validate campaign" in message or "audit campaign" in message:
        # Try to identify campaign in query
        campaign = None
        if query.campaign_id:
            campaign = db.query(Campaign).filter(Campaign.id == query.campaign_id).first()
        else:
            # Query by name matching in database
            campaigns = db.query(Campaign).all()
            for c in campaigns:
                if c.name.lower() in message:
                    campaign = c
                    break
            if not campaign and campaigns:
                # Fallback to latest campaign
                campaign = campaigns[0]
                
        if not campaign:
            return {
                "role": "assistant",
                "content": "I couldn't identify which campaign to audit. Please create a campaign first or specify its name in the prompt."
            }
            
        campaign.status = "Validating"
        db.commit()
        
        # Async invoke orchestrator validation
        background_tasks.add_task(
            orchestrator.execute_campaign_validation_workflow,
            db=db,
            campaign_id=campaign.id,
            browser_type="chromium"
        )
        
        return {
            "role": "assistant",
            "content": f"Understood! I've launched the autonomous multi-agent validation pipeline for campaign '**{campaign.name}**'. You can track its live steps in the execution center.",
            "campaign_id": campaign.id
        }

    # 2. Action: Run tests
    elif "run playwright" in message or "test" in message:
        # Trigger validation on latest campaign as default test run
        latest_campaign = db.query(Campaign).order_by(Campaign.created_at.desc()).first()
        if not latest_campaign:
            return {
                "role": "assistant",
                "content": "No campaigns exist to execute browser tests against. Please create a campaign first."
            }
            
        background_tasks.add_task(
            orchestrator.execute_campaign_validation_workflow,
            db=db,
            campaign_id=latest_campaign.id,
            browser_type="chromium"
        )
        return {
            "role": "assistant",
            "content": f"Launching browser automation suites against landing pages for '**{latest_campaign.name}**' using Chromium.",
            "campaign_id": latest_campaign.id
        }

    # 3. Action: General query answer
    else:
        # Invoke general LLM guidance
        from backend.app.agents.base import BaseAgent
        copilot_bot = BaseAgent(
            name="Copilot",
            role="Enterprise Assistant",
            system_prompt=(
                "You are the Campaign AI OS Chatbot Copilot.\n"
                "Help automation engineers understand and operate this agentic OS.\n"
                "Explain that they can command you to: \n"
                "- 'Validate Campaign [Name]'\n"
                "- 'Run Playwright tests'\n"
                "Keep responses polite, brief, and action-focused."
            )
        )
        reply = copilot_bot.run_prompt(query.message, json_response=False)
        return {
            "role": "assistant",
            "content": reply
        }
