import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from backend.app.db import get_db, Report
from backend.app.schemas import ReportResponse
from backend.app.config import settings
from backend.app.auth import RoleChecker

router = APIRouter(prefix="/reports", tags=["reports"])
auth_checker = RoleChecker(["admin", "campaign_manager", "automation_engineer"])

@router.get("", response_model=List[ReportResponse])
async def list_all_reports(db: Session = Depends(get_db), current_user: dict = Depends(auth_checker)):
    return db.query(Report).order_by(Report.created_at.desc()).all()

@router.get("/{report_id}/download")
async def download_report_file(report_id: str, db: Session = Depends(get_db), current_user: dict = Depends(auth_checker)):
    """Serves the requested report file from local storage."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Extract file subpath: e.g. /static/reports/xyz.pdf -> data/storage/reports/xyz.pdf
    sub_path = report.file_path.replace("/static/", "")
    full_local_path = os.path.join(settings.STORAGE_DIR, sub_path)
    
    if not os.path.exists(full_local_path):
        raise HTTPException(status_code=404, detail=f"Report file not found on disk: {full_local_path}")
        
    media_types = {
        "PDF": "application/pdf",
        "Excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "CSV": "text/csv",
        "HTML": "text/html"
    }
    
    media_type = media_types.get(report.format, "application/octet-stream")
    filename = os.path.basename(full_local_path)
    
    return FileResponse(
        path=full_local_path,
        media_type=media_type,
        filename=filename
    )
