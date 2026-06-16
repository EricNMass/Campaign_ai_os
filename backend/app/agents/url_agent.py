import ssl
import socket
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any
import httpx
from backend.app.agents.base import BaseAgent

class URLAgent(BaseAgent):
    def __init__(self):
        system_prompt = (
            "You are a Quality Assurance URL and Analytics Auditor.\n"
            "Given crawl data for campaign URLs (status code, SSL expiry, redirect trail, query parameters),\n"
            "categorize issues and write detailed enterprise findings. Each finding must contain: \n"
            "- TargetType: URL, UTM, or SSL\n"
            "- Severity: High, Medium, or Low\n"
            "- Description: Details of the failure\n"
            "- Remediation: Instructions on how to fix it\n"
            "Format your output as a valid JSON list. Never wrap the output in backticks."
        )
        super().__init__(name="URLAgent", role="URL Auditor", system_prompt=system_prompt)

    def validate_urls(self, urls: List[str], expected_utms: Dict[str, str]) -> List[Dict[str, Any]]:
        """Crawls, checks SSL, verifies UTM parameters, and returns list of findings."""
        findings = []
        crawl_reports = []

        for url in urls:
            report = {
                "url": url,
                "status_code": None,
                "redirects": [],
                "ssl_expires_days": None,
                "ssl_error": None,
                "query_params": {},
                "utm_validation": {}
            }

            # 1. Check HTTP Status & Redirect Hops
            try:
                with httpx.Client(follow_redirects=True, timeout=10.0) as client:
                    response = client.get(url)
                    report["status_code"] = response.status_code
                    
                    # Capture redirect history
                    for r in response.history:
                        report["redirects"].append(str(r.url))
            except Exception as e:
                report["status_code"] = 0
                report["error"] = str(e)

            # 2. Check SSL Cert
            parsed_url = urllib.parse.urlparse(url)
            if parsed_url.scheme == "https" and parsed_url.hostname:
                try:
                    context = ssl.create_default_context()
                    with socket.create_connection((parsed_url.hostname, 443), timeout=5.0) as sock:
                        with context.wrap_socket(sock, server_hostname=parsed_url.hostname) as ssock:
                            cert = ssock.getpeercert()
                            # Parse cert expiry date: e.g., 'May  9 23:59:59 2026 GMT'
                            expire_str = cert.get("notAfter")
                            if expire_str:
                                expire_dt = datetime.strptime(expire_str, "%b %d %H:%M:%S %Y %Z")
                                delta = expire_dt - datetime.utcnow()
                                report["ssl_expires_days"] = delta.days
                except Exception as e:
                    report["ssl_error"] = str(e)

            # 3. Parse and Verify UTM Parameters
            parsed_query = urllib.parse.parse_qs(parsed_url.query)
            # Flatten lists from parse_qs
            query_params = {k: v[0] for k, v in parsed_query.items()}
            report["query_params"] = query_params

            # Compare against expected UTM guidelines
            utm_keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
            for utm in utm_keys:
                actual = query_params.get(utm)
                expected = expected_utms.get(utm)
                
                if not actual:
                    report["utm_validation"][utm] = "Missing"
                elif expected and actual != expected:
                    report["utm_validation"][utm] = f"Mismatch: expected '{expected}', found '{actual}'"
                else:
                    report["utm_validation"][utm] = "Valid"

            crawl_reports.append(report)

        # 4. Generate structured findings from crawl report via Agent
        prompt = (
            f"Expected UTM constraints: {expected_utms}\n"
            f"Crawl reports gathered:\n{crawl_reports}\n\n"
            "Format issues into structured findings containing keys: target_type, severity, description, remediation."
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
            print(f"[URLAgent] LLM output parsing failed: {e}. Processing findings programmatically.")
            
            # Programmatic fallback findings based on the report
            fallback_findings = []
            for r in crawl_reports:
                if r["status_code"] != 200:
                    fallback_findings.append({
                        "target_type": "URL",
                        "severity": "High",
                        "description": f"URL '{r['url']}' returned HTTP status code {r['status_code']}.",
                        "remediation": f"Verify link destination is live and correctly configured."
                    })
                if r["ssl_expires_days"] is not None and r["ssl_expires_days"] < 30:
                    fallback_findings.append({
                        "target_type": "SSL",
                        "severity": "Medium",
                        "description": f"SSL certificate for '{r['url']}' expires in {r['ssl_expires_days']} days.",
                        "remediation": "Renew SSL cert soon."
                    })
                if r["ssl_error"]:
                    fallback_findings.append({
                        "target_type": "SSL",
                        "severity": "High",
                        "description": f"SSL Connection failed for '{r['url']}': {r['ssl_error']}.",
                        "remediation": "Verify server certificate chain configuration."
                    })
                for utm, issue in r["utm_validation"].items():
                    if issue == "Missing":
                        fallback_findings.append({
                            "target_type": "UTM",
                            "severity": "High" if utm in ["utm_source", "utm_medium", "utm_campaign"] else "Medium",
                            "description": f"Tracking parameter '{utm}' is missing from URL '{r['url']}'.",
                            "remediation": f"Append '{utm}' to campaign URLs to guarantee traffic attribution."
                        })
                    elif "Mismatch" in issue:
                        fallback_findings.append({
                            "target_type": "UTM",
                            "severity": "High",
                            "description": f"Tracking parameter '{utm}' is invalid on URL '{r['url']}': {issue}.",
                            "remediation": f"Update link destination to use expected tracking values."
                        })
            return fallback_findings
