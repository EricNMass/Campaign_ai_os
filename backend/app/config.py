import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", str(Path(__file__).resolve().parent.parent / "data" / "storage"))

    # Security & Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campaign_os_secure_jwt_secret_key_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    # Azure AD / OAuth2 mock settings
    MOCK_AZURE_AD: bool = True
    AZURE_AD_CLIENT_ID: Optional[str] = os.getenv("AZURE_AD_CLIENT_ID", None)
    AZURE_AD_TENANT_ID: Optional[str] = os.getenv("AZURE_AD_TENANT_ID", None)

    # Database & Cache
    # If no DB URL is provided, fallback to SQLite locally
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./campaign_os.db")
    # If no Redis URL is provided, fallback to in-memory queues
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL", None)

    # LLM Settings
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    OPENAI_API_BASE: Optional[str] = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-2.5-flash") # Fallback default

    # Azure Integrations (Optional for local development)
    AZURE_KEYVAULT_URL: Optional[str] = os.getenv("AZURE_KEYVAULT_URL", None)
    AZURE_STORAGE_CONNECTION_STRING: Optional[str] = os.getenv("AZURE_STORAGE_CONNECTION_STRING", None)
    AZURE_STORAGE_CONTAINER: str = os.getenv("AZURE_STORAGE_CONTAINER", "campaign-artifacts")
    
    # Azure DevOps Integration
    AZURE_DEVOPS_ORG_URL: Optional[str] = os.getenv("AZURE_DEVOPS_ORG_URL", None)
    AZURE_DEVOPS_PAT: Optional[str] = os.getenv("AZURE_DEVOPS_PAT", None)
    AZURE_DEVOPS_PROJECT: str = os.getenv("AZURE_DEVOPS_PROJECT", "CampaignAutomation")

    # Playwright Options
    PLAYWRIGHT_HEADLESS: bool = os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() == "true"
    PLAYWRIGHT_CONCURRENCY_LIMIT: int = int(os.getenv("PLAYWRIGHT_CONCURRENCY_LIMIT", "3"))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Create local storage folders if they do not exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "screenshots"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "videos"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "logs"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "reports"), exist_ok=True)
