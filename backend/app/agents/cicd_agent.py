import json
from typing import Dict, Any
from backend.app.agents.base import BaseAgent

class CICDAgent(BaseAgent):
    def __init__(self):
        system_prompt = (
            "You are an expert DevOps and Release Engineer.\n"
            "Analyze raw build/deployment failure logs from Azure DevOps pipelines.\n"
            "Determine the root cause (e.g. environment config, syntax, dependency version mismatch, selector timeout)\n"
            "and suggest detailed remediation steps. If possible, flag if the error can be auto-remediated.\n"
            "Your output must be a JSON object containing keys: status ('Remediated' or 'ManualInterventionRequired'), "
            "logs_analysis, and remediation. Never include markdown code wrappers."
        )
        super().__init__(name="CICDAgent", role="CI/CD Failure Analyser", system_prompt=system_prompt)

    def analyze_pipeline_failure(self, pipeline_name: str, build_id: str, error_logs: str) -> Dict[str, Any]:
        """Parses raw pipeline run error log data to return remediation instructions."""
        prompt = (
            f"Pipeline: {pipeline_name} (Build ID: {build_id})\n"
            f"Error logs captured:\n{error_logs}\n\n"
            "Analyze and output the resolution schema."
        )
        raw_output = self.run_prompt(prompt, json_response=True)
        try:
            cleaned = raw_output.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception as e:
            print(f"[CICDAgent] Failed to parse build logs: {e}. Outputting default report.")
            return {
                "status": "ManualInterventionRequired",
                "logs_analysis": f"Unhandled error: {error_logs[:200]}",
                "remediation": "Examine pipeline logs directly on Azure DevOps portal."
            }

cicd_agent = CICDAgent()

