import os
import sys
import asyncio
import traceback
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.db import Execution, Task

class PlaywrightExecutor:
    def __init__(self):
        self.semaphore = asyncio.Semaphore(settings.PLAYWRIGHT_CONCURRENCY_LIMIT)

    async def execute_campaign_script(
        self, 
        db: Session, 
        execution_id: str, 
        script_code: str, 
        browser_type: str = "chromium"
    ) -> Dict[str, Any]:
        """Executes a Playwright test script inside an isolated process under a semaphore lock."""
        async with self.semaphore:
            print(f"[Executor] Starting execution {execution_id} on {browser_type}...")
            
            # Setup paths
            script_dir = os.path.join(settings.STORAGE_DIR, "scripts")
            os.makedirs(script_dir, exist_ok=True)
            script_path = os.path.join(script_dir, f"{execution_id}.py")
            
            video_dir = os.path.join(settings.STORAGE_DIR, "videos")
            screenshot_dir = os.path.join(settings.STORAGE_DIR, "screenshots")
            log_path = os.path.join(settings.STORAGE_DIR, "logs", f"{execution_id}.log")
            
            # Update database status to Running
            execution = db.query(Execution).filter(Execution.id == execution_id).first()
            if execution:
                execution.status = "Running"
                execution.log_path = f"/static/logs/{execution_id}.log"
                db.commit()

            # Create full runner script with video, screenshot, and page isolation
            runner_code = self._generate_runner_wrapper(
                script_code=script_code,
                execution_id=execution_id,
                browser_type=browser_type,
                video_dir=video_dir,
                screenshot_dir=screenshot_dir
            )
            
            with open(script_path, "w") as f:
                f.write(runner_code)
                
            # Execute python sub-process
            python_exe = sys.executable  # Use current running python interpreter (linked to venv)
            
            # Run the process
            proc = await asyncio.create_subprocess_exec(
                python_exe, script_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Wait for execution and read outputs
            stdout, stderr = await proc.communicate()
            
            # Write logs to file
            log_content = f"--- STDOUT ---\n{stdout.decode('utf-8', errors='ignore')}\n\n--- STDERR ---\n{stderr.decode('utf-8', errors='ignore')}"
            with open(log_path, "w") as f:
                f.write(log_content)
                
            success = (proc.returncode == 0)
            
            # Parse outputs from runner script (such as generated screenshots)
            screenshots = []
            video_rel_path = f"/static/videos/{execution_id}.webm" if success or True else None
            
            # Check what screenshots exist in screenshots folder starting with execution_id
            for file in os.listdir(screenshot_dir):
                if file.startswith(execution_id):
                    screenshots.append(f"/static/screenshots/{file}")
            
            # Update database
            if execution:
                execution.status = "Success" if success else "Failed"
                execution.video_path = video_rel_path if os.path.exists(os.path.join(video_dir, f"{execution_id}.webm")) else None
                execution.screenshot_paths = screenshots
                db.commit()
                
            return {
                "success": success,
                "exit_code": proc.returncode,
                "video_path": execution.video_path if execution else None,
                "screenshots": screenshots,
                "log_path": execution.log_path if execution else None
            }

    def _generate_runner_wrapper(
        self, 
        script_code: str, 
        execution_id: str, 
        browser_type: str, 
        video_dir: str, 
        screenshot_dir: str
    ) -> str:
        """Generates a complete runnable python wrapper enforcing automation rules and capturing outputs."""
        return f"""
import asyncio
import os
import sys
from playwright.async_api import async_playwright

# Injected campaign script logic
{script_code}

async def run():
    print("[Runner] Initializing Playwright...")
    async with async_playwright() as p:
        browser_launcher = getattr(p, "{browser_type}")
        # Launch browser headlessly or headfully based on config
        browser = await browser_launcher.launch(headless=True)
        
        # Setup context with video recording
        context = await browser.new_context(
            record_video_dir={repr(video_dir)},
            viewport={{"width": 1280, "height": 720}}
        )
        
        page = await context.new_page()
        print("[Runner] Browser context created. Launching custom script steps...")
        
        try:
            # The injected script MUST define 'async def execute_steps(page)'
            await execute_steps(page)
            print("[Runner] Script executed successfully.")
        except Exception as e:
            print(f"[Runner] Execution failure: {{e}}", file=sys.stderr)
            # Take screenshot on error
            err_screenshot = os.path.join({repr(screenshot_dir)}, f"{execution_id}_error.png")
            await page.screenshot(path=err_screenshot, full_page=True)
            print(f"[Runner] Error screenshot saved to: {{err_screenshot}}")
            raise e
        finally:
            await context.close()
            # Rename video file to match execution_id
            if context.pages:
                video = await page.video.path()
                if video and os.path.exists(video):
                    dest_video = os.path.join({repr(video_dir)}, f"{execution_id}.webm")
                    os.rename(video, dest_video)
                    print(f"[Runner] Video recorded to: {{dest_video}}")
            await browser.close()

if __name__ == "__main__":
    try:
        asyncio.run(run())
    except Exception as e:
        sys.exit(1)
    sys.exit(0)
"""

playwright_executor = PlaywrightExecutor()
