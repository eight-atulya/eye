import os
import time
import uuid
from typing import Optional, List, Dict, Tuple
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
JOB_HASH_KEY = "eye:job:{job_id}"
JOBS_RECENT_ZSET = "eye:jobs:recent"
QUEUE_KEY = os.getenv("EYE_QUEUE_KEY", "eye:jobs")

STATUS_QUEUED = "QUEUED"
STATUS_RUNNING = "RUNNING"
STATUS_SUCCEEDED = "SUCCEEDED"
STATUS_FAILED = "FAILED"


class JobsStore:
    def __init__(self, url: str = REDIS_URL):
        self.client = redis.Redis.from_url(url)

    def create_job(self, job_type: str, payload: dict) -> str:
        job_id = str(uuid.uuid4())
        now = int(time.time())
        key = JOB_HASH_KEY.format(job_id=job_id)
        self.client.hset(
            key,
            mapping={
                "id": job_id,
                "type": job_type,
                "status": STATUS_QUEUED,
                "created_at": str(now),
            },
        )
        # keep recent list
        self.client.zadd(JOBS_RECENT_ZSET, {job_id: now})
        # enqueue lightweight envelope
        self.client.lpush(QUEUE_KEY, __import__("json").dumps({"id": job_id, "type": job_type, "payload": payload}))
        return job_id

    def set_status(self, job_id: str, status: str) -> None:
        key = JOB_HASH_KEY.format(job_id=job_id)
        self.client.hset(key, mapping={"status": status})

    def get_job(self, job_id: str) -> Optional[Dict[str, str]]:
        key = JOB_HASH_KEY.format(job_id=job_id)
        data = self.client.hgetall(key)
        if not data:
            return None
        return {k.decode(): v.decode() for k, v in data.items()}

    def list_recent(self, limit: int = 20, offset: int = 0) -> List[Dict[str, str]]:
        ids = self.client.zrevrange(JOBS_RECENT_ZSET, offset, offset + limit - 1)
        jobs: List[Dict[str, str]] = []
        for raw_id in ids:
            job_id = raw_id.decode()
            job = self.get_job(job_id)
            if job:
                jobs.append(job)
        return jobs

    def queue_length(self) -> int:
        return int(self.client.llen(QUEUE_KEY))
