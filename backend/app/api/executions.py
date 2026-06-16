from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.db import get_db, Execution, Task
from backend.app.schemas import ExecutionResponse, TaskResponse
from backend.app.auth import RoleChecker

router = APIRouter(prefix="/executions", tags=["executions"])
auth_checker = RoleChecker(["admin", "campaign_manager", "automation_engineer"])

@router.get("", response_model=List[ExecutionResponse])
async def list_executions(db: Session = Depends(get_db), current_user: dict = Depends(auth_checker)):
    return db.query(Execution).order_by(Execution.created_at.desc()).all()

@router.get("/{execution_id}", response_model=ExecutionResponse)
async def get_execution_details(execution_id: str, db: Session = Depends(get_db), current_user: dict = Depends(auth_checker)):
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution run not found")
    return execution

@router.get("/{execution_id}/tasks", response_model=List[TaskResponse])
async def list_execution_tasks(execution_id: str, db: Session = Depends(get_db), current_user: dict = Depends(auth_checker)):
    return db.query(Task).filter(Task.execution_id == execution_id).order_by(Task.created_at.asc()).all()

@router.get("/{execution_id}/logs")
async def get_execution_logs(execution_id: str, db: Session = Depends(get_db), current_user: dict = Depends(auth_checker)):
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
        
    # Read logs from storage
    from backend.app.config import settings
    import os
    
    log_file_path = os.path.join(settings.STORAGE_DIR, "logs", f"{execution_id}.log")
    if not os.path.exists(log_file_path):
        return {"logs": "Log file not created yet or no logs captured."}
        
    with open(log_file_path, "r") as f:
        content = f.read()
    return {"logs": content}
