from fastapi import APIRouter, HTTPException, UploadFile, File, Body
from pydantic import BaseModel
from typing import Dict
from storage.adapters.s3 import S3Adapter
from config import settings
import uuid
import os
import hmac
import hashlib
import httpx

router = APIRouter()

@router.get("/v1/ping")
def ping():
    return {"pong": True}

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/v1/auth/token", response_model=TokenResponse)
def issue_token(payload: LoginRequest):
    if not payload.username or not payload.password:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return TokenResponse(access_token="dev-token", token_type="bearer")


@router.post("/v1/uploads/image")
async def upload_image(file: UploadFile = File(...)) -> Dict[str, str]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")
    # Initialize S3/MinIO adapter
    adapter = S3Adapter(
        bucket=settings.s3_bucket,
        endpoint_url=settings.s3_endpoint,
        access_key=settings.s3_access_key,
        secret_key=settings.s3_secret_key,
        region=settings.s3_region,
    )
    # Generate object key
    ext = os.path.splitext(file.filename or "")[1] or ".bin"
    object_key = f"uploads/images/{uuid.uuid4().hex}{ext}"
    # Read and upload
    data = await file.read()
    uri = adapter.upload_bytes(data, object_key, content_type=file.content_type)
    return {"uri": uri, "key": object_key}


# ---- CVAT integration minimal endpoints ----

class CreateAnnotationProjectRequest(BaseModel):
    name: str
    labels: Dict[str, int]  # label -> id or order


@router.post("/v1/annotations/projects")
async def create_annotation_project(payload: CreateAnnotationProjectRequest):
    async with httpx.AsyncClient(base_url=settings.cvat_base_url, timeout=30.0) as client:
        # Authenticate and create project
        auth = (settings.cvat_username, settings.cvat_password)
        project_resp = await client.post(
            "/api/projects",
            auth=auth,
            json={
                "name": payload.name,
                "labels": [{"name": k} for k in payload.labels.keys()],
            },
        )
        if project_resp.status_code >= 400:
            raise HTTPException(status_code=project_resp.status_code, detail=project_resp.text)
        return project_resp.json()


class CreateAnnotationTaskRequest(BaseModel):
    project_id: int
    name: str
    data_s3_keys: list[str]


@router.post("/v1/annotations/tasks")
async def create_annotation_task(payload: CreateAnnotationTaskRequest):
    # Pre-signed URLs or S3 gateway can be used; for local PoC, pass S3 paths for CVAT to fetch if configured
    async with httpx.AsyncClient(base_url=settings.cvat_base_url, timeout=60.0) as client:
        auth = (settings.cvat_username, settings.cvat_password)
        task_resp = await client.post(
            "/api/tasks",
            auth=auth,
            json={
                "name": payload.name,
                "project_id": payload.project_id,
                # minimal, data upload handled separately or via datumaro/import
            },
        )
        if task_resp.status_code >= 400:
            raise HTTPException(status_code=task_resp.status_code, detail=task_resp.text)
        return task_resp.json()


@router.post("/v1/annotations/webhook")
async def cvat_webhook(payload: dict = Body(...), x_signature: str | None = None):
    # Optional: verify signature if CVAT sends one; placeholder HMAC example
    if x_signature:
        digest = hmac.new(settings.cvat_webhook_secret.encode(), msg=str(payload).encode(), digestmod=hashlib.sha256).hexdigest()
        if not hmac.compare_digest(digest, x_signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
    return {"received": True}
