from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.db import get_db, Campaign, Finding, Report
from backend.app.schemas import CampaignCreate, CampaignResponse, FindingResponse, ReportResponse
from backend.app.agents.orchestrator import orchestrator
from backend.app.auth import RoleChecker

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

# Require campaign manager or admin role to create campaigns
write_checker = RoleChecker(["admin", "campaign_manager", "automation_engineer"])
read_checker = RoleChecker(["admin", "campaign_manager", "automation_engineer"])

@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db), current_user: dict = Depends(write_checker)):
    db_campaign = Campaign(
        name=campaign.name,
        audience=campaign.audience,
        cta=campaign.cta,
        landing_pages=campaign.landing_pages,
        tracking_links=campaign.tracking_links,
        utm_parameters=campaign.utm_parameters,
        email_assets=campaign.email_assets,
        status="Draft"
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.get("", response_model=List[CampaignResponse])
async def list_campaigns(db: Session = Depends(get_db), current_user: dict = Depends(read_checker)):
    return db.query(Campaign).order_by(Campaign.created_at.desc()).all()

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: str, db: Session = Depends(get_db), current_user: dict = Depends(read_checker)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(campaign_id: str, db: Session = Depends(get_db), current_user: dict = Depends(write_checker)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(campaign)
    db.commit()
    return None

@router.post("/{campaign_id}/validate")
async def trigger_campaign_validation(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    browser_type: str = "chromium",
    db: Session = Depends(get_db),
    current_user: dict = Depends(write_checker)
):
    """Triggers the autonomous validation runner in a background worker thread."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign.status = "Validating"
    db.commit()
    
    # Run agentic workflow asynchronously
    background_tasks.add_task(
        orchestrator.execute_campaign_validation_workflow,
        db=db,
        campaign_id=campaign_id,
        browser_type=browser_type
    )
    
    return {"message": "Autonomous audit validation started.", "campaign_id": campaign_id}

@router.get("/{campaign_id}/findings", response_model=List[FindingResponse])
async def list_findings(campaign_id: str, db: Session = Depends(get_db), current_user: dict = Depends(read_checker)):
    return db.query(Finding).filter(Finding.campaign_id == campaign_id).order_by(Finding.created_at.desc()).all()

@router.get("/{campaign_id}/reports", response_model=List[ReportResponse])
async def list_reports(campaign_id: str, db: Session = Depends(get_db), current_user: dict = Depends(read_checker)):
    return db.query(Report).filter(Report.campaign_id == campaign_id).order_by(Report.created_at.desc()).all()
