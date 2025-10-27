import time
from typing import Dict, Any

class SimpleWorker:
    def process(self, job: Dict[str, Any]) -> Dict[str, Any]:
        time.sleep(0.1)
        return {"job_id": job.get("job_id"), "status": "completed"}
