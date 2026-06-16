import json
from typing import Dict, Any
from backend.app.agents.base import BaseAgent

class PlaywrightAgent(BaseAgent):
    def __init__(self):
        system_prompt = (
            "You are a Staff QA Automation Engineer expert in Playwright Python.\n"
            "Your task is to write automated scripts to test landing pages.\n"
            "Your output must be EXACTLY a Python script that defines a single async function:\n"
            "`async def execute_steps(page)`\n"
            "Inside this function, you should use Playwright async calls on the `page` argument. For example:\n"
            "  - await page.goto(url)\n"
            "  - await page.wait_for_selector(selector)\n"
            "  - await page.click(selector)\n"
            "  - print('Verified landing page title: ', await page.title())\n"
            "Never include imports, main function loops, or browser launch statements in your response.\n"
            "Ensure the generated code is robust, handles slow element rendering, and uses generic selectors when target details are scarce."
        )
        super().__init__(name="PlaywrightAgent", role="Playwright Developer", system_prompt=system_prompt)

    def generate_script(self, campaign_name: str, landing_pages: list, cta_text: str) -> str:
        """Generates raw Playwright automation code snippet to test campaign elements."""
        target_url = landing_pages[0] if landing_pages else "https://example.com"
        
        prompt = (
            f"Generate an automation script to validate the landing page: {target_url}\n"
            f"For Campaign: {campaign_name}\n"
            f"Expected Call to Action (CTA) Button/Link contains Text: {cta_text}\n\n"
            "Write the definition of `async def execute_steps(page)` to verify the url loads and CTA is interactable."
        )
        
        raw_output = self.run_prompt(prompt, json_response=False)
        
        # Clean the output (strip markdown markers)
        cleaned = raw_output.strip()
        if cleaned.startswith("```python"):
            cleaned = cleaned[9:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
            
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
            
        return cleaned.strip()
