import re
import urllib.parse
from typing import List, Dict, Any
from backend.app.agents.base import BaseAgent

class EmailQAAgent(BaseAgent):
    def __init__(self):
        system_prompt = (
            "You are an expert Email Quality Assurance Engineer.\n"
            "Analyze extracted metadata from email templates and identify bugs:\n"
            "- Unrendered personalization tokens (e.g. double curly braces like '{{FirstName}}')\n"
            "- Missing tracking pixels (usually 1x1 image links)\n"
            "- Missing unsubscribe/opt-out links\n"
            "- Broken images or broken tracking links\n"
            "- Subject line optimization issues (e.g., too long, spam keywords)\n"
            "Format findings as a JSON list. Do not use backticks or markdown around the output."
        )
        super().__init__(name="EmailQAAgent", role="Email Auditor", system_prompt=system_prompt)

    def validate_email(self, subject: str, email_body: str) -> List[Dict[str, Any]]:
        """Scans email text/HTML content for common asset, link, and token defects."""
        
        # 1. Look for personalization tokens
        # Matches {{Token}}, [[Token]], %Token%
        token_patterns = [
            r"\{\{[a-zA-Z0-9_]+\}\}",
            r"\[\[[a-zA-Z0-9_]+\]\]",
            r"%[a-zA-Z0-9_]+%"
        ]
        tokens_found = []
        for pattern in token_patterns:
            tokens_found.extend(re.findall(pattern, email_body))
            
        # 2. Extract links and images from email body
        # Simple HTML href and src regexes
        links = re.findall(r'href=["\'](https?://[^"\']+)["\']', email_body)
        images = re.findall(r'src=["\'](https?://[^"\']+)["\']', email_body)
        
        # 3. Check for tracking pixel (1x1 pixel image check or known tracking URL patterns)
        has_pixel = False
        for img in images:
            if "pixel" in img.lower() or "track" in img.lower() or "1x1" in img.lower() or "/open/" in img.lower():
                has_pixel = True
                break
                
        # 4. Check for unsubscribe link
        has_unsubscribe = False
        for link in links:
            if "unsubscribe" in link.lower() or "opt-out" in link.lower() or "optout" in link.lower():
                has_unsubscribe = True
                break

        # Send report metrics to LLM for final verification findings
        email_metadata = {
            "subject": subject,
            "tokens_found": list(set(tokens_found)),
            "links_extracted": list(set(links)),
            "images_extracted": list(set(images)),
            "has_tracking_pixel": has_pixel,
            "has_unsubscribe_link": has_unsubscribe,
            "body_length_chars": len(email_body)
        }

        prompt = (
            f"Review email campaign properties:\n{email_metadata}\n\n"
            "Write QA findings. Key keys are target_type, severity, description, remediation."
        )
        
        raw_output = self.run_prompt(prompt, json_response=True)
        try:
            cleaned = raw_output.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            import json
            return json.loads(cleaned.strip())
        except Exception as e:
            print(f"[EmailQAAgent] Failed to parse findings: {e}. Programmatic fallback active.")
            
            # Programmatic fallback findings
            fallback_findings = []
            if not has_unsubscribe:
                fallback_findings.append({
                    "target_type": "Email",
                    "severity": "High",
                    "description": "The email campaign is missing an unsubscribe or opt-out link.",
                    "remediation": "Include an unsubscribe CTA in the email footer to comply with CAN-SPAM regulations."
                })
            if not has_pixel:
                fallback_findings.append({
                    "target_type": "Email",
                    "severity": "Medium",
                    "description": "No open tracking pixel was detected in the email html body.",
                    "remediation": "Embed an open tracking pixel (1x1 image) from your marketing platform."
                })
            if len(tokens_found) > 0:
                # Advise verification of tokens
                fallback_findings.append({
                    "target_type": "Email",
                    "severity": "Low",
                    "description": f"Personalization tokens found: {list(set(tokens_found))}. Ensure these map to active database parameters.",
                    "remediation": "Confirm template context variables are provided during send dispatch."
                })
            return fallback_findings
