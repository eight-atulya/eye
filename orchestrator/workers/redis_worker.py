import time
import json
import os
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
QUEUE_KEY = os.getenv("EYE_QUEUE_KEY", "eye:jobs")
JOB_HASH_KEY = "eye:job:{job_id}"
STATUS_RUNNING = "RUNNING"
STATUS_SUCCEEDED = "SUCCEEDED"
STATUS_FAILED = "FAILED"


def main():
    client = redis.Redis.from_url(REDIS_URL)
    print("[worker] starting...", flush=True)
    while True:
        item = client.brpop(QUEUE_KEY, timeout=5)
        if item is None:
            continue
        _, data = item
        job_id = None
        try:
            job = json.loads(data)
            job_id = job.get("id")
        except Exception:
            print("[worker] invalid job", flush=True)
            continue
        try:
            if job_id:
                client.hset(JOB_HASH_KEY.format(job_id=job_id), mapping={"status": STATUS_RUNNING})
            # simulate work
            time.sleep(0.2)
            if job_id:
                client.hset(JOB_HASH_KEY.format(job_id=job_id), mapping={"status": STATUS_SUCCEEDED})
            print(f"[worker] done: {job_id}", flush=True)
        except Exception as e:
            if job_id:
                client.hset(JOB_HASH_KEY.format(job_id=job_id), mapping={"status": STATUS_FAILED})
            print(f"[worker] error: {e}", flush=True)


if __name__ == "__main__":
    main()
