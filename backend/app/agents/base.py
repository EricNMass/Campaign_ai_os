import json
import logging
from typing import Optional, List, Dict, Any
from backend.app.config import settings

logger = logging.getLogger("AgentFramework")

class BaseAgent:
    """Core class for agents providing LLM communication, parsing, and context tracking."""
    def __init__(self, name: str, role: str, system_prompt: str):
        self.name = name
        self.role = role
        self.system_prompt = system_prompt
        self.client = None
        self.use_openai = False
        
        # Initialize Google GenAI or OpenAI client
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
                print(f"[{self.name}] Initialized Google GenAI SDK client.")
            except Exception as e:
                print(f"[{self.name}] Failed to initialize Google GenAI SDK: {e}. Trying OpenAI fallback.")
                
        if not self.client and settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                self.client = OpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    base_url=settings.OPENAI_API_BASE
                )
                self.use_openai = True
                print(f"[{self.name}] Initialized OpenAI-compatible client.")
            except Exception as e:
                print(f"[{self.name}] Failed to initialize OpenAI client: {e}")
                
        if not self.client:
            print(f"[{self.name}] WARNING: No active LLM clients found. Running in Local Mock mode.")

    def run_prompt(self, user_prompt: str, json_response: bool = False) -> str:
        """Submits prompts to the LLM or retrieves mock answers if offline."""
        if not self.client:
            return self._get_mock_fallback(user_prompt, json_response)
            
        try:
            if not self.use_openai:
                # Google GenAI Call
                model = settings.LLM_MODEL if settings.LLM_MODEL else "gemini-2.5-flash"
                contents = f"System prompt: {self.system_prompt}\n\nUser instructions: {user_prompt}"
                
                # Request JSON if needed
                config = {}
                if json_response:
                    config = {"response_mime_type": "application/json"}
                    
                response = self.client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config
                )
                return response.text.strip()
            else:
                # OpenAI Call
                response = self.client.chat.completions.create(
                    model=settings.LLM_MODEL if settings.LLM_MODEL else "gpt-4-turbo",
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"} if json_response else None,
                    temperature=0.2
                )
                return response.choices[0].message.content.strip()
                
        except Exception as e:
            print(f"[{self.name}] API Query failed: {e}. Returning mock fallback.")
            return self._get_mock_fallback(user_prompt, json_response)

    def _get_mock_fallback(self, user_prompt: str, json_response: bool) -> str:
        """Provides simulated responses when running without internet or credentials."""
        # Simple local routing logic based on agent names
        user_lower = user_prompt.lower()
        
        if self.name == "CampaignAgent":
            data = {
                "campaign_name": "Summer Sales Campaign",
                "audience": "Registered users with interest in electronics",
                "cta": "Buy Now and get 20% discount",
                "landing_pages": ["https://example.com/summer-sales"],
                "tracking_links": ["https://example.com/summer-sales?utm_source=email&utm_medium=newsletter&utm_campaign=summer_promo_2026"],
                "utm_parameters": {
                    "utm_source": "email",
                    "utm_medium": "newsletter",
                    "utm_campaign": "summer_promo_2026"
                },
                "email_assets": ["Get ready for the hottest deals of the summer! Click here: https://example.com/summer-sales?utm_source=email&utm_medium=newsletter&utm_campaign=summer_promo_2026"]
            }
            return json.dumps(data) if json_response else "Campaign: Summer Sales successfully parsed."
            
        elif self.name == "URLAgent":
            data = {
                "status": "completed",
                "findings": [
                    {
                        "target_type": "URL",
                        "severity": "Low",
                        "description": "SSL Certificate expires in 25 days for example.com",
                        "remediation": "Renew SSL cert soon."
                    },
                    {
                        "target_type": "UTM",
                        "severity": "High",
                        "description": "UTM Content and Term parameters are missing on CTA link.",
                        "remediation": "Add utm_content=buy_now to track specific button clicks."
                    }
                ]
            }
            return json.dumps(data) if json_response else "URL validation complete. Findings generated."
            
        elif self.name == "EmailQAAgent":
            data = {
                "status": "completed",
                "findings": [
                    {
                        "target_type": "Email",
                        "severity": "Medium",
                        "description": "Unrendered token '{{LastName}}' found in footer.",
                        "remediation": "Verify that your mailer variables include LastName property."
                    }
                ]
            }
            return json.dumps(data) if json_response else "Email QA validation complete. Personalization parsed."
            
        elif self.name == "PlaywrightAgent":
            # Return a valid test script!
            script = """async def execute_steps(page):
    print("Navigating to target landing page...")
    await page.goto("https://example.com/summer-sales")
    print("Page Title:", await page.title())
    print("Verifying call-to-action button is visible...")
    cta = page.locator("text=Buy Now")
    if await cta.is_visible():
        print("CTA element verified!")
    else:
        print("CTA link missing, checking fallbacks...")
"""
            if json_response:
                return json.dumps({"script": script})
            return script
            
        elif self.name == "RepairAgent":
            fixed_script = """async def execute_steps(page):
    print("Navigating to target page...")
    await page.goto("https://example.com/summer-sales")
    print("Locating CTA button...")
    # Updated locator logic to avoid timeout crashes
    await page.wait_for_selector("a, button", timeout=5000)
    print("Found interactable buttons. Clicking first button...")
"""
            if json_response:
                return json.dumps({"fixed_script": fixed_script})
            return fixed_script
            
        elif self.name == "CICDAgent":
            data = {
                "status": "Remediated",
                "logs_analysis": "Pipeline failed because Playwright tests timed out on chromium element loading. Auto-retry triggered.",
                "remediation": "Re-run build with updated timeouts."
            }
            return json.dumps(data) if json_response else "CI/CD checks complete."
            
        elif self.name == "ReportingAgent":
            return "Report compiled."
            
        return "{}" if json_response else "Mock Agent output."
