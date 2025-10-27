from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from services.jobs import JobsStore

router = APIRouter()
store = JobsStore()

class CreateJobRequest(BaseModel):
    type: str
    payload: dict

@router.post('/v1/jobs')
def create_job(req: CreateJobRequest):
    job_id = store.create_job(req.type, req.payload)
    return {"id": job_id}

@router.get('/v1/jobs/{job_id}')
def get_job(job_id: str):
    job = store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get('/v1/jobs')
def list_jobs(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    jobs = store.list_recent(limit=limit, offset=offset)
    return {"items": jobs, "limit": limit, "offset": offset}
