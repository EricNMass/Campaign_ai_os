import json
from typing import Dict, Any
from backend.app.agents.base import BaseAgent

class CampaignAgent(BaseAgent):
    def __init__(self):
        system_prompt = (
            "You are an expert marketing campaign intelligence agent.\n"
            "Your task is to analyze raw marketing briefs and requirements to extract: \n"
            "1. Campaign Name\n"
            "2. Audience specifications\n"
            "3. Primary CTA (Call to Action) texts\n"
            "4. Main Landing page links\n"
            "5. Expected UTM campaign tracking parameters (source, medium, campaign, content, term)\n"
            "6. Email newsletter copy details and HTML/Text assets\n"
            "Ensure you return a clean JSON object containing all these keys. Never include markdown code backticks around your output."
        )
        super().__init__(name="CampaignAgent", role="Campaign Requirements Analyst", system_prompt=system_prompt)

    def analyze_requirements(self, requirements_text: str) -> Dict[str, Any]:
        """Analyzes unstructured campaign requirements text and returns structured fields."""
        prompt = (
            f"Please parse this campaign brief:\n\n{requirements_text}\n\n"
            "Return a JSON object with keys: name, audience, cta, landing_pages, tracking_links, utm_parameters, email_assets"
        )
        raw_output = self.run_prompt(prompt, json_response=True)
        try:
            # Strip backticks if present
            cleaned = raw_output.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception as e:
            print(f"[CampaignAgent] Failed to parse JSON response: {e}. Raw: {raw_output}")
            # Fallback to local default dict
            return {
                "name": "Fallback Campaign",
                "audience": "All audiences",
                "cta": "Click Here",
                "landing_pages": [],
                "tracking_links": [],
                "utm_parameters": {},
                "email_assets": []
            }
