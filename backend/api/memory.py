"""
EYE Memory API - RESTful endpoints for memory management

Provides endpoints for:
- Uploading and processing memories
- Searching memories with AI
- Retrieving memory data
- Managing user memories

Author: Anurag Atulya — EYE for Humanity
"""

import base64
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import io

from services.memory_service import (
    get_memory_service, 
    MemoryUploadRequest, 
    MemorySearchRequest, 
    MemoryResponse,
    MemoryJobStatus,
    MemoryRecord
)
from services.memory_processing_service import get_memory_processing_service

router = APIRouter(prefix="/v1/memory", tags=["memory"])

# Request/Response Models
class MemoryUploadResponse(BaseModel):
    memory_id: str
    status: str
    message: str

class MemorySearchResponse(BaseModel):
    memories: List[MemoryResponse]
    total_found: int
    query: str

class MemoryStatsResponse(BaseModel):
    total_memories: int
    total_size_bytes: int
    processing_pending: int
    processing_completed: int
    processing_failed: int

# Dependency to get current user (placeholder)
async def get_current_user() -> str:
    """Get current user ID - placeholder implementation"""
    # In production, this would extract user from JWT token
    return "default_user"

@router.post("/upload", response_model=MemoryUploadResponse)
async def upload_memory(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_tags: Optional[str] = Form(None),
    user_notes: Optional[str] = Form(None),
    is_private: bool = Form(False),
    user_id: str = Depends(get_current_user)
):
    """
    Upload a memory (image) for processing and storage
    
    - **file**: Image file to upload
    - **user_tags**: Comma-separated tags for the memory
    - **user_notes**: User notes about the memory
    - **is_private**: Whether the memory should be private
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file data
        file_data = await file.read()
        
        # Convert to base64
        image_base64 = base64.b64encode(file_data).decode('utf-8')
        
        # Parse tags
        tags = []
        if user_tags:
            tags = [tag.strip() for tag in user_tags.split(',') if tag.strip()]
        
        # Create upload request
        upload_request = MemoryUploadRequest(
            user_id=user_id,
            image_data=image_base64,
            filename=file.filename,
            user_tags=tags,
            user_notes=user_notes,
            is_private=is_private
        )
        
        # Upload memory
        memory_service = get_memory_service()
        await memory_service.initialize()
        
        memory_id, image_uuid = await memory_service.upload_memory(upload_request)
        
        # Initialize processing service and queue the job
        processing_service = get_memory_processing_service()
        await processing_service.initialize()
        
        # Queue for comprehensive processing (YOLO-E + LLM + Embedding)
        job_id = await processing_service.queue_memory_processing(
            memory_id=memory_id,
            image_uuid=image_uuid,
            image_data=base64.b64decode(upload_request.image_data),
            user_tags=upload_request.user_tags or [],
            user_notes=upload_request.user_notes
        )
        
        return MemoryUploadResponse(
            memory_id=memory_id,
            status="queued",
            message=f"Memory uploaded successfully and queued for processing (Job ID: {job_id})"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload memory: {str(e)}")

@router.post("/search", response_model=MemorySearchResponse)
async def search_memories(
    query: str = Form(...),
    limit: int = Form(10),
    include_private: bool = Form(False),
    filter_tags: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user)
):
    """
    Search memories using natural language query
    
    - **query**: Natural language search query
    - **limit**: Maximum number of results (1-50)
    - **include_private**: Whether to include private memories
    - **filter_tags**: Comma-separated tags to filter by
    """
    try:
        # Parse filter tags
        tags = []
        if filter_tags:
            tags = [tag.strip() for tag in filter_tags.split(',') if tag.strip()]
        
        # Create search request
        search_request = MemorySearchRequest(
            user_id=user_id,
            query=query,
            limit=min(limit, 50),
            include_private=include_private,
            filter_tags=tags if tags else None
        )
        
        # Search memories
        memory_service = get_memory_service()
        await memory_service.initialize()
        
        memories = await memory_service.search_memories(search_request)
        
        return MemorySearchResponse(
            memories=memories,
            total_found=len(memories),
            query=query
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search memories: {str(e)}")

@router.get("/memories", response_model=List[MemoryResponse])
async def get_user_memories(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user)
):
    """
    Get all memories for the current user
    
    - **limit**: Number of memories to return
    - **offset**: Number of memories to skip
    """
    try:
        memory_service = get_memory_service()
        await memory_service.initialize()
        
        memories = await memory_service.get_user_memories(user_id, limit, offset)
        
        return memories
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get memories: {str(e)}")

@router.get("/memories/{memory_id}", response_model=MemoryResponse)
async def get_memory(
    memory_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get a specific memory by ID
    """
    try:
        memory_service = get_memory_service()
        await memory_service.initialize()
        
        memory = await memory_service.get_memory_by_id(memory_id, user_id)
        
        if not memory:
            raise HTTPException(status_code=404, detail="Memory not found")
        
        return memory
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get memory: {str(e)}")

@router.get("/image/{image_uuid}")
async def get_memory_image(image_uuid: str):
    """
    Get the actual image file for a memory
    """
    try:
        memory_service = get_memory_service()
        await memory_service.initialize()
        
        # Find memory record by image UUID
        memory_record = memory_service.db_session.query(MemoryRecord).filter_by(image_uuid=image_uuid).first()
        
        if not memory_record:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Get image from MinIO
        image_data = memory_service.minio_client.get_object(
            memory_service.config.minio_bucket,
            memory_record.image_path
        )
        
        # Return image as streaming response
        return StreamingResponse(
            io.BytesIO(image_data.read()),
            media_type=memory_record.content_type or "image/jpeg"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get image: {str(e)}")

@router.patch("/memories/{memory_id}")
async def update_memory(
    memory_id: str,
    update_data: dict,
    user_id: str = Depends(get_current_user)
):
    """
    Update a memory record with processing results
    """
    try:
        memory_service = get_memory_service()
        initialized = await memory_service.initialize()
        
        if not initialized:
            raise HTTPException(status_code=503, detail="Memory service not available")
        
        # Update the memory record in the database
        memory_record = memory_service.db_session.query(MemoryRecord).filter_by(
            id=memory_id, 
            user_id=user_id
        ).first()
        
        if not memory_record:
            raise HTTPException(status_code=404, detail="Memory not found")
        
        # Update fields
        if "ai_description" in update_data:
            memory_record.ai_description = update_data["ai_description"]
        if "detected_objects" in update_data:
            memory_record.detected_objects = update_data["detected_objects"]
        if "scene_context" in update_data:
            memory_record.scene_context = update_data["scene_context"]
        if "emotional_context" in update_data:
            memory_record.emotional_context = update_data["emotional_context"]
        if "processing_status" in update_data:
            memory_record.processing_status = update_data["processing_status"]
        
        memory_service.db_session.commit()
        
        return {"status": "success", "message": "Memory updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update memory: {str(e)}")

@router.delete("/memories/{memory_id}")
async def delete_memory(
    memory_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Delete a memory
    """
    try:
        memory_service = get_memory_service()
        await memory_service.initialize()
        
        success = await memory_service.delete_memory(memory_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Memory not found")
        
        return {"message": "Memory deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete memory: {str(e)}")

@router.get("/stats", response_model=MemoryStatsResponse)
async def get_memory_stats(user_id: str = Depends(get_current_user)):
    """
    Get memory statistics for the current user
    """
    try:
        memory_service = get_memory_service()
        initialized = await memory_service.initialize()
        
        if not initialized:
            # Return empty stats if service is not initialized
            return MemoryStatsResponse(
                total_memories=0,
                total_size_bytes=0,
                processing_pending=0,
                processing_completed=0,
                processing_failed=0
            )
        
        # Get stats from database
        total_memories = memory_service.db_session.query(MemoryRecord).filter_by(user_id=user_id).count()
        
        pending = memory_service.db_session.query(MemoryRecord).filter_by(
            user_id=user_id, 
            processing_status="pending"
        ).count()
        
        completed = memory_service.db_session.query(MemoryRecord).filter_by(
            user_id=user_id, 
            processing_status="completed"
        ).count()
        
        failed = memory_service.db_session.query(MemoryRecord).filter_by(
            user_id=user_id, 
            processing_status="failed"
        ).count()
        
        # Calculate total size
        from sqlalchemy import func
        total_size = memory_service.db_session.query(
            func.sum(MemoryRecord.file_size)
        ).filter_by(user_id=user_id).scalar() or 0
        
        return MemoryStatsResponse(
            total_memories=total_memories,
            total_size_bytes=total_size,
            processing_pending=pending,
            processing_completed=completed,
            processing_failed=failed
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@router.get("/jobs/{job_id}", response_model=MemoryJobStatus)
async def get_job_status(job_id: str):
    """
    Get the status of a memory processing job
    """
    try:
        processing_service = get_memory_processing_service()
        job = await processing_service.get_job_status(job_id)
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Calculate progress based on status
        progress = 0
        if job.status == "queued":
            progress = 10
        elif job.status == "processing":
            progress = 50
        elif job.status == "completed":
            progress = 100
        elif job.status == "failed":
            progress = 0
        
        return MemoryJobStatus(
            job_id=job.job_id,
            status=job.status,
            progress=progress,
            message=f"Job {job.status}",
            created_at=job.created_at,
            completed_at=job.completed_at,
            error=job.error
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")

@router.post("/chat-with-memories")
async def chat_with_memories(
    message: str = Form(...),
    user_id: str = Depends(get_current_user)
):
    """
    Chat with EYE AI using memories as context
    """
    try:
        memory_service = get_memory_service()
        await memory_service.initialize()
        
        # Search for relevant memories
        search_request = MemorySearchRequest(
            user_id=user_id,
            query=message,
            limit=5,
            include_private=False
        )
        
        relevant_memories = await memory_service.search_memories(search_request)
        
        # Build context from memories
        context = ""
        if relevant_memories:
            context = "Relevant memories:\n"
            for memory in relevant_memories:
                context += f"- {memory.ai_description}\n"
                if memory.user_notes:
                    context += f"  User notes: {memory.user_notes}\n"
        
        # Use EYE AI to generate response with memory context
        # This would integrate with the existing EYE AI chat system
        response = {
            "message": f"Based on your memories: {message}",
            "relevant_memories": [
                {
                    "id": mem.id,
                    "description": mem.ai_description,
                    "image_url": mem.image_url,
                    "similarity": mem.similarity_score
                }
                for mem in relevant_memories
            ],
            "context": context
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to chat with memories: {str(e)}")
