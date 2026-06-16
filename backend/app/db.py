import uuid
from datetime import datetime
from typing import Generator
from sqlalchemy import create_engine, Column, String, DateTime, Text, Float, Integer, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from backend.app.config import settings

# Base declarative class
Base = declarative_base()

# Helper function to generate UUIDs
def generate_uuid() -> str:
    return str(uuid.uuid4())

class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    audience = Column(String(255))
    cta = Column(String(255))
    landing_pages = Column(JSON, default=list)        # list of URL strings
    tracking_links = Column(JSON, default=list)       # list of URL strings
    utm_parameters = Column(JSON, default=dict)       # dict of expected UTM key-values
    email_assets = Column(JSON, default=list)         # list of email templates/bodies
    status = Column(String(50), default="Draft")      # Draft, Active, Completed, Failed
    created_at = Column(DateTime, default=datetime.utcnow)

    executions = relationship("Execution", back_populates="campaign", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="campaign", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="campaign", cascade="all, delete-orphan")


class Execution(Base):
    __tablename__ = "executions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    trigger_type = Column(String(50), nullable=False)  # Manual, Pipeline, Cron
    browser_type = Column(String(50), nullable=False)  # Chromium, Firefox, Webkit
    status = Column(String(50), default="Pending")     # Pending, Running, Success, Failed
    video_path = Column(String(500))
    screenshot_paths = Column(JSON, default=list)      # list of file paths
    log_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="executions")
    tasks = relationship("Task", back_populates="execution", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    execution_id = Column(String(36), ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    agent_name = Column(String(100), nullable=False)
    task_name = Column(String(255), nullable=False)
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    status = Column(String(50), default="Pending")     # Pending, Running, Success, Failed
    execution_time_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    execution = relationship("Execution", back_populates="tasks")


class Deployment(Base):
    __tablename__ = "deployments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    pipeline_name = Column(String(255), nullable=False)
    build_id = Column(String(100))
    status = Column(String(50), nullable=False)        # Succeeded, Failed, InProgress, Remediated
    commit_hash = Column(String(100))
    release_notes = Column(Text)
    remediation_steps = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(100), nullable=False)         # Executive, Engineering, CampaignHealth
    format = Column(String(50), nullable=False)        # PDF, CSV, Excel, HTML
    file_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="reports")


class Finding(Base):
    __tablename__ = "findings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    target_type = Column(String(50), nullable=False)   # URL, UTM, Email, Script
    severity = Column(String(50), nullable=False)      # High, Medium, Low
    description = Column(Text, nullable=False)
    remediation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="findings")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100))
    action = Column(String(255), nullable=False)
    resource = Column(String(255))
    details = Column(Text)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)


# Connection Setup
engine_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite requires check_same_thread=False for multi-threaded FastAPI servers
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator:
    """Dependency injection wrapper to yield DB sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes tables in database."""
    Base.metadata.create_base_all = Base.metadata.create_all(bind=engine)
