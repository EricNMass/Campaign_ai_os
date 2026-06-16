from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# ----------------- User & Token Schemas -----------------
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# ----------------- Campaign Schemas -----------------
class CampaignBase(BaseModel):
    name: str
    audience: Optional[str] = None
    cta: Optional[str] = None
    landing_pages: List[str] = Field(default_factory=list)
    tracking_links: List[str] = Field(default_factory=list)
    utm_parameters: Dict[str, str] = Field(default_factory=dict)
    email_assets: List[str] = Field(default_factory=list)

class CampaignCreate(CampaignBase):
    pass

class CampaignResponse(CampaignBase):
    id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Task Schemas -----------------
class TaskBase(BaseModel):
    agent_name: str
    task_name: str
    input_data: Dict[str, Any] = Field(default_factory=dict)
    output_data: Dict[str, Any] = Field(default_factory=dict)
    status: str
    execution_time_seconds: float

class TaskResponse(TaskBase):
    id: str
    execution_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Execution Schemas -----------------
class ExecutionBase(BaseModel):
    campaign_id: str
    trigger_type: str
    browser_type: str

class ExecutionCreate(ExecutionBase):
    pass

class ExecutionResponse(ExecutionBase):
    id: str
    status: str
    video_path: Optional[str] = None
    screenshot_paths: List[str] = Field(default_factory=list)
    log_path: Optional[str] = None
    created_at: datetime
    tasks: List[TaskResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

# ----------------- Finding Schemas -----------------
class FindingBase(BaseModel):
    campaign_id: str
    target_type: str # URL, UTM, Email, Script
    severity: str    # High, Medium, Low
    description: str
    remediation: Optional[str] = None

class FindingResponse(FindingBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Deployment Schemas -----------------
class DeploymentBase(BaseModel):
    pipeline_name: str
    build_id: Optional[str] = None
    status: str
    commit_hash: Optional[str] = None
    release_notes: Optional[str] = None
    remediation_steps: Optional[str] = None

class DeploymentCreate(DeploymentBase):
    pass

class DeploymentResponse(DeploymentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Report Schemas -----------------
class ReportResponse(BaseModel):
    id: str
    campaign_id: str
    type: str
    format: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Audit Log Schemas -----------------
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[str] = None
    action: str
    resource: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Agent Copilot Chat Schemas -----------------
class ChatMessage(BaseModel):
    role: str # user, assistant, system, agent
    content: str
    agent_name: Optional[str] = None
    timestamp: Optional[datetime] = None

class CopilotQuery(BaseModel):
    message: str
    campaign_id: Optional[str] = None
