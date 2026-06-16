from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.services.memory import long_term_memory

class SelfImprovementEngine:
    def __init__(self):
        pass

    def record_failure_remediation(self, db: Session, error_signature: str, error_context: str, resolution_code: str):
        """Records an execution error and its successful fix."""
        long_term_memory.add_past_experience(
            db_session=db,
            category="PlaywrightScriptError",
            problem=f"Signature: {error_signature} | Context: {error_context}",
            fix=resolution_code,
            success=True
        )

    def suggest_remediation(self, db: Session, error_message: str) -> List[Dict[str, Any]]:
        """Queries historical resolutions for a matching error message."""
        return long_term_memory.search_similar_failures(
            db_session=db,
            query_text=error_message,
            category="PlaywrightScriptError",
            limit=2
        )

self_improvement_engine = SelfImprovementEngine()
