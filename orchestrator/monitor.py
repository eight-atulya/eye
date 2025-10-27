from typing import Dict
from datetime import datetime

class Monitor:
    def __init__(self):
        self.states: Dict[str, str] = {}
        self.timestamps: Dict[str, datetime] = {}

    def set_state(self, job_id: str, state: str) -> None:
        self.states[job_id] = state
        self.timestamps[job_id] = datetime.utcnow()

    def get_state(self, job_id: str) -> str:
        return self.states.get(job_id, "unknown")
