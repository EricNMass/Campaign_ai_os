import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.agents.base import BaseAgent
from backend.app.services.playwright_executor import playwright_executor
from backend.app.services.self_improvement import self_improvement_engine

class RepairAgent(BaseAgent):
    def __init__(self):
        system_prompt = (
            "You are an expert self-healing test automation agent.\n"
            "Your task is to analyze failing Playwright Python scripts alongside their execution logs.\n"
            "Identify the root cause of the crash (e.g., element selector changed, timeout occurred, network latency).\n"
            "Output the entire corrected script defining: `async def execute_steps(page)`.\n"
            "Do not include markdown tags or surrounding descriptions; output ONLY the Python function code."
        )
        super().__init__(name="RepairAgent", role="Self-Healing Script Debugger", system_prompt=system_prompt)

    async def heal_and_retest(
        self, 
        db: Session, 
        execution_id: str, 
        original_script: str, 
        error_logs: str, 
        browser_type: str = "chromium",
        max_attempts: int = 3
    ) -> Dict[str, Any]:
        """Runs the self-correcting loop: Analyze -> Fix -> Test -> Validate -> Repeat."""
        current_script = original_script
        current_logs = error_logs
        attempts = 0

        while attempts < max_attempts:
            attempts += 1
            print(f"[RepairAgent] Healing attempt {attempts}/{max_attempts} for execution {execution_id}...")
            
            # Query self-improvement database for past solutions
            history = self_improvement_engine.suggest_remediation(db, current_logs)
            history_context = ""
            if history:
                history_context = f"Here are similar past problems and how they were resolved:\n{history}\n\n"

            # 1. Ask LLM to generate the fix
            prompt = (
                f"{history_context}"
                f"Failing script code:\n{current_script}\n\n"
                f"Execution failure logs:\n{current_logs}\n\n"
                "Please fix the script selectors, timing issues, or page navigation to prevent this error. "
                "Output only the full replacement for `async def execute_steps(page)`."
            )
            
            fixed_code = self.run_prompt(prompt, json_response=False)
            
            # Clean markdown formatting if added by LLM
            cleaned_code = fixed_code.strip()
            if cleaned_code.startswith("```python"):
                cleaned_code = cleaned_code[9:]
            elif cleaned_code.startswith("```"):
                cleaned_code = cleaned_code[3:]
            if cleaned_code.endswith("```"):
                cleaned_code = cleaned_code[:-3]
            cleaned_code = cleaned_code.strip()

            # 2. Run the test script again
            # We override the execution path to point to a temporary test script
            print(f"[RepairAgent] Re-testing fixed script code...")
            result = await playwright_executor.execute_campaign_script(
                db=db,
                execution_id=execution_id,
                script_code=cleaned_code,
                browser_type=browser_type
            )
            
            if result["success"]:
                print(f"[RepairAgent] Success achieved on attempt {attempts}!")
                
                # Save the fix into the self-improvement registry for future queries
                self_improvement_engine.record_failure_remediation(
                    db=db,
                    error_signature=current_logs.split("\n")[-2] if len(current_logs.split("\n")) > 1 else "UnknownError",
                    error_context=current_logs[:500],
                    resolution_code=cleaned_code
                )
                
                return {
                    "success": True,
                    "attempts": attempts,
                    "fixed_script": cleaned_code,
                    "video_path": result["video_path"],
                    "screenshots": result["screenshots"],
                    "log_path": result["log_path"]
                }
            
            # Update loop variables if it fails again
            # Retrieve latest log contents
            try:
                log_local = result["log_path"].replace("/static/", f"{settings.STORAGE_DIR}/")
                with open(log_local, "r") as f:
                    current_logs = f.read()
            except Exception:
                current_logs = "Execution failed again with no available logs."
                
            current_script = cleaned_code

        print(f"[RepairAgent] Failed to fix script after {max_attempts} attempts.")
        return {
            "success": False,
            "attempts": max_attempts,
            "error_logs": current_logs
        }
