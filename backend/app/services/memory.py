import json
import threading
from typing import Any, Optional, Dict, List
from backend.app.config import settings

class ShortTermMemory:
    """Handles ephemeral workflow states, current execution steps, and locks."""
    def __init__(self):
        self.redis_client = None
        self._local_cache: Dict[str, str] = {}
        self._lock = threading.Lock()

        if settings.REDIS_URL:
            try:
                import redis
                self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                print(f"[Memory] Connected to Redis cache: {settings.REDIS_URL}")
            except Exception as e:
                print(f"[Memory] Redis initialization failed: {e}. Using local memory cache.")
                self.redis_client = None

    def store_state(self, session_id: str, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        serialized = json.dumps(value)
        redis_key = f"session:{session_id}:{key}"
        
        if self.redis_client:
            try:
                self.redis_client.setex(redis_key, ttl_seconds, serialized)
                return
            except Exception as e:
                print(f"[Memory] Redis store error: {e}. Falling back to local cache.")
                
        with self._lock:
            self._local_cache[redis_key] = serialized

    def get_state(self, session_id: str, key: str) -> Optional[Any]:
        redis_key = f"session:{session_id}:{key}"
        
        if self.redis_client:
            try:
                val = self.redis_client.get(redis_key)
                if val:
                    return json.loads(val)
                return None
            except Exception as e:
                print(f"[Memory] Redis get error: {e}. Falling back to local cache.")
                
        with self._lock:
            val = self._local_cache.get(redis_key)
            if val:
                return json.loads(val)
            return None

    def delete_state(self, session_id: str, key: str) -> None:
        redis_key = f"session:{session_id}:{key}"
        if self.redis_client:
            try:
                self.redis_client.delete(redis_key)
                return
            except Exception as e:
                print(f"[Memory] Redis delete error: {e}")
                
        with self._lock:
            self._local_cache.pop(redis_key, None)


class LongTermMemory:
    """Handles past validation failures, remediation logs, and campaign learning."""
    def __init__(self):
        # We query structural SQL logs from DB for search
        pass

    def add_past_experience(self, db_session, category: str, problem: str, fix: str, success: bool = True) -> None:
        """Saves a past script repair or campaign failure to the audit log and findings."""
        # Logs the details to audit logs / findings for searchability
        from backend.app.db import AuditLog
        details = {
            "category": category,
            "problem": problem,
            "remediation_fix": fix,
            "success": success
        }
        log_entry = AuditLog(
            user_id="AgentOrchestrator",
            action="LearnExperience",
            resource=category,
            details=json.dumps(details)
        )
        db_session.add(log_entry)
        db_session.commit()

    def search_similar_failures(self, db_session, query_text: str, category: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Queries past failures and remediations from DB using keyword parsing."""
        from backend.app.db import AuditLog
        logs = db_session.query(AuditLog).filter(
            AuditLog.action == "LearnExperience",
            AuditLog.resource == category
        ).order_by(AuditLog.id.desc()).all()
        
        results = []
        import difflib
        
        for l in logs:
            try:
                data = json.loads(l.details)
                prob = data.get("problem", "")
                
                # Compute string ratio similarity
                ratio = difflib.SequenceMatcher(None, query_text.lower(), prob.lower()).ratio()
                if ratio > 0.35: # Only return somewhat similar items
                    results.append({
                        "problem": prob,
                        "fix": data.get("remediation_fix", ""),
                        "similarity": ratio
                    })
            except Exception:
                continue
                
        # Sort by similarity desc
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]

short_term_memory = ShortTermMemory()
long_term_memory = LongTermMemory()
