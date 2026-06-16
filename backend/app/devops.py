import httpx
from typing import Dict, Any, List
from backend.app.config import settings
from backend.app.agents.cicd_agent import cicd_agent

class AzureDevOpsService:
    def __init__(self):
        self.org_url = settings.AZURE_DEVOPS_ORG_URL
        self.pat = settings.AZURE_DEVOPS_PAT
        self.project = settings.AZURE_DEVOPS_PROJECT
        
        self.headers = {}
        if self.pat:
            import base64
            # Setup Basic Auth header for DevOps PAT
            auth_str = f":{self.pat}"
            encoded_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
            self.headers = {"Authorization": f"Basic {encoded_auth}"}

    async def trigger_pipeline(self, pipeline_id: int) -> Dict[str, Any]:
        """Triggers a pipeline build run on Azure DevOps."""
        if not self.org_url or not self.pat:
            print("[DevOps] Azure integration inactive. Simulating pipeline trigger...")
            return {
                "id": 1045,
                "name": f"Build-Run-1045",
                "status": "InProgress",
                "url": "https://dev.azure.com/mock-org/mock-project/_build/index?buildId=1045"
            }

        url = f"{self.org_url}/{self.project}/_apis/pipelines/{pipeline_id}/runs?api-version=7.0"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={}, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                return {
                    "id": data.get("id"),
                    "name": data.get("name"),
                    "status": data.get("state"),
                    "url": data.get("_links", {}).get("web", {}).get("href")
                }
            else:
                raise Exception(f"Failed to trigger DevOps pipeline: {response.text}")

    async def get_pipeline_run_status(self, run_id: int) -> Dict[str, Any]:
        """Fetches status of a pipeline run."""
        if not self.org_url or not self.pat:
            return {
                "id": run_id,
                "status": "Completed",
                "result": "Succeeded"
            }

        url = f"{self.org_url}/{self.project}/_apis/pipelines/runs/{run_id}?api-version=7.0"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                return {
                    "id": data.get("id"),
                    "status": data.get("state"),
                    "result": data.get("result") # Succeeded, Failed, Canceled
                }
            else:
                raise Exception(f"Failed to fetch run status: {response.text}")

    async def fetch_failed_build_logs(self, build_id: int) -> str:
        """Retrieves raw log stream content of a failed build step."""
        if not self.org_url or not self.pat:
            # Return realistic mock failure logs
            return (
                "##[section]Starting: Test Playwright Script\n"
                "Error: page.goto: Timeout 30000ms exceeded.\n"
                "=========================================\n"
                "  at execute_steps (scripts/test_camp.py:12:14)\n"
                "  Failed selector check: text='Submit Application'\n"
                "##[error]Process completed with exit code 1.\n"
                "##[section]Finishing: Test Playwright Script\n"
            )

        # Retrieve pipeline build logs using Azure DevOps API
        # First query timelines to find failed jobs
        timeline_url = f"{self.org_url}/{self.project}/_apis/build/builds/{build_id}/timeline?api-version=7.0"
        async with httpx.AsyncClient() as client:
            response = await client.get(timeline_url, headers=self.headers)
            if response.status_code == 200:
                records = response.json().get("records", [])
                for record in records:
                    if record.get("result") == "failed" and record.get("log"):
                        # Download log text
                        log_url = record["log"]["url"]
                        log_res = await client.get(log_url, headers=self.headers)
                        if log_res.status_code == 200:
                            return log_res.text
            return "No failed log stream identified."

    async def auto_remediate_pipeline_failure(self, db_session, build_id: int) -> Dict[str, Any]:
        """Analyzes, remediates, and triggers a PR/run to resolve build failure."""
        print(f"[DevOps] Triggering self-healing remediation for Build {build_id}...")
        
        # 1. Fetch logs
        logs = await self.fetch_failed_build_logs(build_id)
        
        # 2. CI/CD Agent analyzes logs
        analysis = cicd_agent.analyze_pipeline_failure("DeploymentPipeline", str(build_id), logs)
        
        # 3. Create pull request with suggested patch if remediated
        pr_created = False
        if analysis.get("status") == "Remediated":
            # Simulate/create Git PR patching the timeout or config
            pr_created = await self.create_pull_request(
                source_branch=f"fix/build-{build_id}",
                target_branch="main",
                title=f"Auto-Heal: Resolve Build #{build_id} timeout",
                description=f"Automated PR by Campaign OS:\n\n**Analysis:**\n{analysis.get('logs_analysis')}\n\n**Remediation:**\n{analysis.get('remediation')}"
            )
            
        return {
            "build_id": build_id,
            "analysis": analysis.get("logs_analysis"),
            "remediation": analysis.get("remediation"),
            "status": analysis.get("status"),
            "pr_created": pr_created
        }

    async def create_pull_request(
        self, 
        source_branch: str, 
        target_branch: str, 
        title: str, 
        description: str
    ) -> bool:
        """Creates a Git pull request on Azure DevOps repository."""
        if not self.org_url or not self.pat:
            print(f"[DevOps] Simulating PR creation from {source_branch} to {target_branch}...")
            return True

        # Azure DevOps Repository REST API for PRs
        url = f"{self.org_url}/{self.project}/_apis/git/repositories/{self.project}/pullrequests?api-version=7.0"
        payload = {
            "sourceRefName": f"refs/heads/{source_branch}",
            "targetRefName": f"refs/heads/{target_branch}",
            "title": title,
            "description": description
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            return response.status_code == 201

azure_devops_service = AzureDevOpsService()
