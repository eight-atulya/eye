from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.queue import QueueClient

router = APIRouter()
queue_client = QueueClient()

class EnqueueRequest(BaseModel):
    type: str
    payload: dict

@router.post('/v1/queue/enqueue')
def enqueue_job(req: EnqueueRequest):
    result = queue_client.enqueue({"type": req.type, "payload": req.payload})
    if result <= 0:
        raise HTTPException(status_code=500, detail="Failed to enqueue")
    return {"enqueued": True, "size": int(result)}

@router.get('/v1/queue/dequeue')
def dequeue_job():
    job = queue_client.dequeue(block=False)
    return {"job": job}
