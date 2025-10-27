import os
import json
from typing import Optional
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
QUEUE_KEY = os.getenv("EYE_QUEUE_KEY", "eye:jobs")

class QueueClient:
    def __init__(self, url: str = REDIS_URL, queue_key: str = QUEUE_KEY):
        self.client = redis.Redis.from_url(url)
        self.queue_key = queue_key

    def enqueue(self, payload: dict) -> int:
        data = json.dumps(payload)
        return self.client.lpush(self.queue_key, data)

    def dequeue(self, block: bool = False, timeout: int = 1) -> Optional[dict]:
        if block:
            item = self.client.brpop(self.queue_key, timeout=timeout)
            if item is None:
                return None
            _, data = item
        else:
            data = self.client.rpop(self.queue_key)
            if data is None:
                return None
        try:
            return json.loads(data)
        except Exception:
            return None
