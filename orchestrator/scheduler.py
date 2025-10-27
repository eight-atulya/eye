from typing import Any, Dict, Optional
from datetime import datetime

class Scheduler:
    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {}

    def enqueue(self, job_id: str, payload: Dict[str, Any]) -> None:
        self.jobs[job_id] = {"payload": payload, "enqueued_at": datetime.utcnow()}

    def dequeue(self) -> Optional[Dict[str, Any]]:
        if not self.jobs:
            return None
        job_id, job = self.jobs.popitem()
        job["job_id"] = job_id
        return job
