from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Request, Depends, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Any, Union
import uuid
import json
import os
import shutil
import yaml
from datetime import datetime, timedelta
import asyncio
import logging
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
import pandas as pd
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Boolean, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import redis
from concurrent.futures import ThreadPoolExecutor
import threading
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Database Models
Base = declarative_base()

class AnnotationProject(Base):
    __tablename__ = "annotation_projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    labels = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String(50), default="active")
    owner_id = Column(String(255))
    team_id = Column(String(255))
    settings = Column(JSONB, default={})
    metrics = Column(JSONB, default={})

class AnnotationTask(Base):
    __tablename__ = "annotation_tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('annotation_projects.id'))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    images = Column(JSONB, default=[])
    annotations = Column(JSONB, default={})
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assigned_to = Column(String(255))
    reviewer_id = Column(String(255))
    priority = Column(String(20), default="medium")
    due_date = Column(DateTime)
    progress = Column(Float, default=0.0)
    quality_score = Column(Float)
    task_metadata = Column(JSONB, default={})

class AnnotationLabel(Base):
    __tablename__ = "annotation_labels"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('annotation_projects.id'))
    name = Column(String(255), nullable=False)
    color = Column(String(7), default="#FF0000")
    category = Column(String(100), default="object")
    attributes = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

class Annotation(Base):
    __tablename__ = "annotations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey('annotation_tasks.id'))
    image_filename = Column(String(255), nullable=False)
    label_id = Column(UUID(as_uuid=True), ForeignKey('annotation_labels.id'))
    type = Column(String(50), nullable=False)  # bbox, polygon, keypoint, mask
    coordinates = Column(JSONB, nullable=False)
    confidence = Column(Float)
    attributes = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(255))
    reviewed_by = Column(String(255))
    review_status = Column(String(50), default="pending")

class AnnotationReview(Base):
    __tablename__ = "annotation_reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    annotation_id = Column(UUID(as_uuid=True), ForeignKey('annotations.id'))
    reviewer_id = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)  # approved, rejected, needs_revision
    comments = Column(Text)
    score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

# Enhanced Pydantic Models
class AnnotationProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    labels: List[Dict[str, Any]] = []
    settings: Dict[str, Any] = {}
    team_id: Optional[str] = None

class AnnotationProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    labels: Optional[List[Dict[str, Any]]] = None
    settings: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class AnnotationTaskCreate(BaseModel):
    project_id: str
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    due_date: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

class AnnotationCreate(BaseModel):
    task_id: str
    image_filename: str
    label_id: str
    type: str = Field(..., pattern="^(bbox|polygon|keypoint|mask)$")
    coordinates: List[Dict[str, float]]
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    attributes: Dict[str, Any] = {}

class AnnotationUpdate(BaseModel):
    coordinates: Optional[List[Dict[str, float]]] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    attributes: Optional[Dict[str, Any]] = None

class AnnotationReviewCreate(BaseModel):
    annotation_id: str
    status: str = Field(..., pattern="^(approved|rejected|needs_revision)$")
    comments: Optional[str] = None
    score: Optional[float] = Field(None, ge=0.0, le=10.0)

class AnnotationExportRequest(BaseModel):
    format: str = Field(..., pattern="^(coco|yolo|pascal_voc|supervisely|labelbox)$")
    include_images: bool = False
    filter_labels: Optional[List[str]] = None
    quality_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    include_reviewed_only: bool = False

class AnnotationStatsResponse(BaseModel):
    total_projects: int
    total_tasks: int
    total_annotations: int
    completion_rate: float
    average_quality_score: float
    pending_reviews: int
    team_stats: Dict[str, Any]

# Configuration and Storage
ANNOTATIONS_DIR = Path("/app/storage/annotations")
PROJECTS_DIR = ANNOTATIONS_DIR / "projects"
TASKS_DIR = ANNOTATIONS_DIR / "tasks"
IMAGES_DIR = ANNOTATIONS_DIR / "images"
EXPORTS_DIR = ANNOTATIONS_DIR / "exports"
TEMP_DIR = ANNOTATIONS_DIR / "temp"

# Ensure directories exist
for directory in [ANNOTATIONS_DIR, PROJECTS_DIR, TASKS_DIR, IMAGES_DIR, EXPORTS_DIR, TEMP_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Database setup
DATABASE_URL = "postgresql://vision:vision@db:5433/vision"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Redis setup
redis_client = redis.Redis(host='redis', port=6380, db=0, decode_responses=True)

# Thread pool for background tasks
executor = ThreadPoolExecutor(max_workers=4)

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Utility Functions
def calculate_annotation_metrics(annotations: List[Dict]) -> Dict[str, Any]:
    """Calculate comprehensive annotation metrics"""
    if not annotations:
        return {"count": 0, "average_confidence": 0, "label_distribution": {}}
    
    confidences = [ann.get("confidence", 0) for ann in annotations if ann.get("confidence")]
    label_counts = {}
    
    for ann in annotations:
        label = ann.get("label_name", "unknown")
        label_counts[label] = label_counts.get(label, 0) + 1
        
        return {
        "count": len(annotations),
        "average_confidence": np.mean(confidences) if confidences else 0,
        "label_distribution": label_counts,
        "confidence_std": np.std(confidences) if confidences else 0,
        "min_confidence": min(confidences) if confidences else 0,
        "max_confidence": max(confidences) if confidences else 0
    }

def validate_annotation_coordinates(coordinates: List[Dict], annotation_type: str) -> bool:
    """Validate annotation coordinates based on type"""
    if not coordinates:
        return False
    
    if annotation_type == "bbox":
        return len(coordinates) == 2 and all("x" in coord and "y" in coord for coord in coordinates)
    elif annotation_type == "polygon":
        return len(coordinates) >= 3 and all("x" in coord and "y" in coord for coord in coordinates)
    elif annotation_type == "keypoint":
        return len(coordinates) == 1 and "x" in coordinates[0] and "y" in coordinates[0]
    elif annotation_type == "mask":
        return len(coordinates) > 0
    
    return False

def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename with timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    name, ext = os.path.splitext(original_filename)
    return f"{name}_{timestamp}_{uuid.uuid4().hex[:8]}{ext}"

def compress_image(image_path: Path, quality: int = 85) -> Path:
    """Compress image while maintaining quality"""
    with Image.open(image_path) as img:
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        
        # Save with compression
        compressed_path = image_path.parent / f"compressed_{image_path.name}"
        img.save(compressed_path, 'JPEG', quality=quality, optimize=True)
        
        # Replace original if significantly smaller
        if compressed_path.stat().st_size < image_path.stat().st_size * 0.8:
            image_path.unlink()
            compressed_path.rename(image_path)
            return image_path
        else:
            compressed_path.unlink()
            return image_path

def create_thumbnail(image_path: Path, size: tuple = (200, 200)) -> Path:
    """Create thumbnail for image"""
    thumbnail_path = image_path.parent / f"thumb_{image_path.name}"
    
    with Image.open(image_path) as img:
        img.thumbnail(size, Image.Resampling.LANCZOS)
        img.save(thumbnail_path, 'JPEG', quality=90)
    
    return thumbnail_path

# Background Tasks
def process_uploaded_images(task_id: str, image_paths: List[Path]):
    """Background task to process uploaded images"""
    try:
        for image_path in image_paths:
            # Compress image
            compress_image(image_path)
            
            # Create thumbnail
            create_thumbnail(image_path)
            
            # Extract metadata
            with Image.open(image_path) as img:
                metadata = {
                    "width": img.width,
                    "height": img.height,
                    "format": img.format,
                    "mode": img.mode,
                    "size_bytes": image_path.stat().st_size
                }
                
                # Update task metadata
                redis_client.hset(f"task:{task_id}:metadata", image_path.name, json.dumps(metadata))
        
        logger.info(f"Processed {len(image_paths)} images for task {task_id}")
    except Exception as e:
        logger.error(f"Error processing images for task {task_id}: {e}")

def export_annotations_background(task_id: str, export_format: str, export_path: Path):
    """Background task to export annotations"""
    try:
        # Implementation for different export formats
        if export_format == "coco":
            export_coco_format(task_id, export_path)
        elif export_format == "yolo":
            export_yolo_format(task_id, export_path)
        elif export_format == "pascal_voc":
            export_pascal_voc_format(task_id, export_path)
        
        logger.info(f"Exported annotations for task {task_id} in {export_format} format")
    except Exception as e:
        logger.error(f"Error exporting annotations for task {task_id}: {e}")

# CVAT Integration imports
from services.cvat_integration import CVATIntegrationService, create_cvat_service, CVATWebhookHandler
import httpx

# CVAT Configuration
CVAT_URL = "http://cvat:8080"  # Default CVAT URL
CVAT_USERNAME = "admin"
CVAT_PASSWORD = "admin"

# Initialize CVAT service
cvat_service = None

async def get_cvat_service() -> CVATIntegrationService:
    """Get or create CVAT service instance"""
    global cvat_service
    if cvat_service is None:
        cvat_service = create_cvat_service(CVAT_URL, CVAT_USERNAME, CVAT_PASSWORD)
        await cvat_service.initialize()
    return cvat_service

# API Endpoints

@router.post("/v1/annotations/projects", response_model=Dict[str, Any])
async def create_annotation_project(
    project_data: AnnotationProjectCreate,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new annotation project with enhanced features"""
    try:
        # Create project in database
        db_project = AnnotationProject(
            name=project_data.name,
            description=project_data.description,
            labels=project_data.labels,
            settings=project_data.settings,
            team_id=project_data.team_id,
            metrics={}
        )
        
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        
        # Create project directory
        project_dir = PROJECTS_DIR / str(db_project.id)
        project_dir.mkdir(exist_ok=True)
        
        # Save project metadata
        project_file = project_dir / "project.json"
        with open(project_file, "w") as f:
            json.dump({
                "id": str(db_project.id),
                "name": db_project.name,
                "description": db_project.description,
                "labels": db_project.labels,
                "settings": db_project.settings,
                "created_at": db_project.created_at.isoformat(),
                "updated_at": db_project.updated_at.isoformat(),
                "status": db_project.status
            }, f, default=str)
        
        # Initialize metrics
        db_project.metrics = {
            "total_tasks": 0,
            "total_annotations": 0,
            "completion_rate": 0.0,
            "average_quality_score": 0.0,
            "last_activity": datetime.utcnow().isoformat()
        }
        db.commit()
        
        return {
            "status": "success",
            "project": {
                "id": str(db_project.id),
                "name": db_project.name,
                "description": db_project.description,
                "labels": db_project.labels,
                "settings": db_project.settings,
                "created_at": db_project.created_at.isoformat(),
                "updated_at": db_project.updated_at.isoformat(),
                "status": db_project.status,
                "metrics": db_project.metrics
            },
            "message": f"Project '{project_data.name}' created successfully"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@router.get("/v1/annotations/projects", response_model=Dict[str, Any])
async def list_annotation_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    team_id: Optional[str] = Query(None),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """List annotation projects with pagination and filtering"""
    try:
        query = db.query(AnnotationProject)
        
        if status:
            query = query.filter(AnnotationProject.status == status)
        if team_id:
            query = query.filter(AnnotationProject.team_id == team_id)
        
        total = query.count()
        projects = query.offset(skip).limit(limit).all()
        
        project_list = []
        for project in projects:
            project_list.append({
                "id": str(project.id),
                "name": project.name,
                "description": project.description,
                "labels": project.labels,
                "settings": project.settings,
                "created_at": project.created_at.isoformat(),
                "updated_at": project.updated_at.isoformat(),
                "status": project.status,
                "metrics": project.metrics
            })
        
        return {
            "status": "success",
            "projects": project_list,
            "pagination": {
                "total": total,
                "skip": skip,
                "limit": limit,
                "has_more": skip + limit < total
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to list projects: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list projects: {str(e)}")

@router.get("/v1/annotations/projects/{project_id}", response_model=Dict[str, Any])
async def get_annotation_project(
    project_id: str,
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Get a specific annotation project with detailed information"""
    try:
        project = db.query(AnnotationProject).filter(AnnotationProject.id == project_id).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get project statistics
        tasks_count = db.query(AnnotationTask).filter(AnnotationTask.project_id == project_id).count()
        annotations_count = db.query(Annotation).join(AnnotationTask).filter(
            AnnotationTask.project_id == project_id
        ).count()
        
        # Calculate completion rate
        completed_tasks = db.query(AnnotationTask).filter(
            AnnotationTask.project_id == project_id,
            AnnotationTask.status == "completed"
        ).count()
        
        completion_rate = (completed_tasks / tasks_count * 100) if tasks_count > 0 else 0
        
        # Update metrics
        project.metrics.update({
            "total_tasks": tasks_count,
            "total_annotations": annotations_count,
            "completion_rate": completion_rate,
            "last_activity": datetime.utcnow().isoformat()
        })
        db.commit()
        
        return {
            "status": "success",
            "project": {
                "id": str(project.id),
                "name": project.name,
                "description": project.description,
                "labels": project.labels,
                "settings": project.settings,
                "created_at": project.created_at.isoformat(),
                "updated_at": project.updated_at.isoformat(),
                "status": project.status,
                "metrics": project.metrics
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get project: {str(e)}")

@router.put("/v1/annotations/projects/{project_id}", response_model=Dict[str, Any])
async def update_annotation_project(
    project_id: str,
    project_data: AnnotationProjectUpdate,
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Update an annotation project"""
    try:
        project = db.query(AnnotationProject).filter(AnnotationProject.id == project_id).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update fields
        if project_data.name is not None:
            project.name = project_data.name
        if project_data.description is not None:
            project.description = project_data.description
        if project_data.labels is not None:
            project.labels = project_data.labels
        if project_data.settings is not None:
            project.settings = project_data.settings
        if project_data.status is not None:
            project.status = project_data.status
        
        project.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "status": "success",
            "project": {
                "id": str(project.id),
                "name": project.name,
                "description": project.description,
                "labels": project.labels,
                "settings": project.settings,
                "created_at": project.created_at.isoformat(),
                "updated_at": project.updated_at.isoformat(),
                "status": project.status,
                "metrics": project.metrics
            },
            "message": "Project updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

@router.post("/v1/annotations/tasks", response_model=Dict[str, Any])
async def create_annotation_task(
    task_data: AnnotationTaskCreate,
    files: List[UploadFile] = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new annotation task with multiple image uploads"""
    try:
        # Verify project exists
        project = db.query(AnnotationProject).filter(AnnotationProject.id == task_data.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Create task in database
        db_task = AnnotationTask(
            project_id=task_data.project_id,
            name=task_data.name,
            description=task_data.description,
            assigned_to=task_data.assigned_to,
            priority=task_data.priority,
            due_date=task_data.due_date,
            task_metadata=task_data.metadata
        )
        
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        
        # Create task directory
        task_dir = TASKS_DIR / str(db_task.id)
        task_dir.mkdir(exist_ok=True)
        
        images_dir = task_dir / "images"
        images_dir.mkdir(exist_ok=True)
        
        # Process uploaded images
        uploaded_images = []
        image_paths = []
        
        for file in files:
            if file.content_type and file.content_type.startswith("image/"):
                # Generate unique filename
                file_ext = os.path.splitext(file.filename or "")[1] or ".jpg"
                image_filename = generate_unique_filename(file.filename or "image")
                image_path = images_dir / image_filename
                
                # Save image
                content = await file.read()
                with open(image_path, "wb") as buffer:
                    buffer.write(content)
                
                uploaded_images.append(image_filename)
                image_paths.append(image_path)
        
        # Update task with image list
        db_task.images = uploaded_images
        db.commit()
        
        # Background processing of images
        background_tasks.add_task(process_uploaded_images, str(db_task.id), image_paths)
        
        # Save task metadata
        task_file = task_dir / "task.json"
        with open(task_file, "w") as f:
            json.dump({
                "id": str(db_task.id),
                "project_id": str(db_task.project_id),
                "name": db_task.name,
                "description": db_task.description,
                "images": db_task.images,
                "annotations": {},
                "status": db_task.status,
                "assigned_to": db_task.assigned_to,
                "priority": db_task.priority,
                "due_date": db_task.due_date.isoformat() if db_task.due_date else None,
                "created_at": db_task.created_at.isoformat(),
                "updated_at": db_task.updated_at.isoformat(),
                "metadata": db_task.task_metadata
            }, f, default=str)
        
        return {
            "status": "success",
            "task": {
                "id": str(db_task.id),
                "project_id": str(db_task.project_id),
                "name": db_task.name,
                "description": db_task.description,
                "images": db_task.images,
                "status": db_task.status,
                "assigned_to": db_task.assigned_to,
                "priority": db_task.priority,
                "due_date": db_task.due_date.isoformat() if db_task.due_date else None,
                "created_at": db_task.created_at.isoformat(),
                "updated_at": db_task.updated_at.isoformat(),
                "metadata": db_task.task_metadata
            },
            "uploaded_images": len(uploaded_images),
            "message": f"Task '{task_data.name}' created with {len(uploaded_images)} images"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@router.get("/v1/annotations/tasks", response_model=Dict[str, Any])
async def list_annotation_tasks(
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """List annotation tasks with advanced filtering"""
    try:
        query = db.query(AnnotationTask)
        
        if project_id:
            query = query.filter(AnnotationTask.project_id == project_id)
        if status:
            query = query.filter(AnnotationTask.status == status)
        if assigned_to:
            query = query.filter(AnnotationTask.assigned_to == assigned_to)
        
        total = query.count()
        tasks = query.offset(skip).limit(limit).all()
        
        task_list = []
        for task in tasks:
            # Calculate progress
            total_images = len(task.images) if task.images else 0
            annotated_images = len(task.annotations) if task.annotations else 0
            progress = (annotated_images / total_images * 100) if total_images > 0 else 0
            
            task_list.append({
                "id": str(task.id),
                "project_id": str(task.project_id),
                "name": task.name,
                "description": task.description,
                "images": task.images,
                "status": task.status,
                "assigned_to": task.assigned_to,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "progress": progress,
                "quality_score": task.quality_score,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat(),
                "metadata": task.task_metadata
            })
        
        return {
            "status": "success",
            "tasks": task_list,
            "pagination": {
                "total": total,
                "skip": skip,
                "limit": limit,
                "has_more": skip + limit < total
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to list tasks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list tasks: {str(e)}")

@router.get("/v1/annotations/tasks/{task_id}", response_model=Dict[str, Any])
async def get_annotation_task(
    task_id: str,
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Get a specific annotation task with detailed information"""
    try:
        task = db.query(AnnotationTask).filter(AnnotationTask.id == task_id).first()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Calculate progress and metrics
        total_images = len(task.images) if task.images else 0
        annotated_images = len(task.annotations) if task.annotations else 0
        progress = (annotated_images / total_images * 100) if total_images > 0 else 0
        
        # Get annotation statistics
        annotations_count = 0
        if task.annotations:
            for image_annotations in task.annotations.values():
                annotations_count += len(image_annotations)
        
        return {
            "status": "success",
            "task": {
                "id": str(task.id),
                "project_id": str(task.project_id),
                "name": task.name,
                "description": task.description,
                "images": task.images,
                "annotations": task.annotations,
                "status": task.status,
                "assigned_to": task.assigned_to,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "progress": progress,
                "quality_score": task.quality_score,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat(),
                "metadata": task.task_metadata,
                "statistics": {
                    "total_images": total_images,
                    "annotated_images": annotated_images,
                    "total_annotations": annotations_count,
                    "completion_rate": progress
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get task: {str(e)}")

@router.post("/v1/annotations/tasks/{task_id}/annotations", response_model=Dict[str, Any])
async def save_annotations(
    task_id: str,
    image_filename: str = Form(...),
    annotations_json: str = Form(...),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Save annotations for a specific image in a task with validation"""
    try:
        task = db.query(AnnotationTask).filter(AnnotationTask.id == task_id).first()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Parse and validate annotations
        annotations = json.loads(annotations_json)
        
        # Validate each annotation
        for annotation in annotations:
            if not validate_annotation_coordinates(annotation.get("coordinates", []), annotation.get("type", "")):
                raise HTTPException(status_code=400, detail=f"Invalid coordinates for annotation type {annotation.get('type')}")
        
        # Update annotations for this image
        if not task.annotations:
            task.annotations = {}
        
        task.annotations[image_filename] = annotations
        task.updated_at = datetime.utcnow()
        
        # Calculate progress
        total_images = len(task.images) if task.images else 0
        annotated_images = len(task.annotations)
        progress = (annotated_images / total_images * 100) if total_images > 0 else 0
        task.progress = progress
        
        # Update status based on progress
        if progress >= 100:
            task.status = "completed"
        elif progress > 0:
            task.status = "in_progress"
        
        db.commit()
        
        # Calculate metrics
        metrics = calculate_annotation_metrics(annotations)
        
        return {
            "status": "success",
            "message": f"Annotations saved for {image_filename}",
            "annotation_count": len(annotations),
            "progress": progress,
            "metrics": metrics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save annotations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save annotations: {str(e)}")

@router.get("/v1/annotations/tasks/{task_id}/images/{image_filename}")
async def get_task_image(task_id: str, image_filename: str):
    """Serve image files for annotation tasks with caching"""
    try:
        image_path = TASKS_DIR / task_id / "images" / image_filename
        
        if not image_path.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Check for thumbnail first
        thumbnail_path = image_path.parent / f"thumb_{image_filename}"
        if thumbnail_path.exists():
            return FileResponse(str(thumbnail_path))
        
        return FileResponse(str(image_path))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to serve image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to serve image: {str(e)}")

@router.post("/v1/annotations/tasks/{task_id}/export", response_model=Dict[str, Any])
async def export_annotations(
    task_id: str,
    export_request: AnnotationExportRequest,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Export annotations in various formats with background processing"""
    try:
        task = db.query(AnnotationTask).filter(AnnotationTask.id == task_id).first()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Create export directory
        export_dir = EXPORTS_DIR / task_id
        export_dir.mkdir(exist_ok=True)
        
        # Generate export filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_filename = f"annotations_{export_request.format}_{timestamp}"
        
        if export_request.format == "coco":
            export_path = export_dir / f"{export_filename}.json"
        elif export_request.format == "yolo":
            export_path = export_dir / f"{export_filename}.zip"
        elif export_request.format == "pascal_voc":
            export_path = export_dir / f"{export_filename}.xml"
        else:
            export_path = export_dir / f"{export_filename}.zip"
        
        # Background export
        background_tasks.add_task(export_annotations_background, task_id, export_request.format, export_path)
        
        return {
            "status": "success",
            "format": export_request.format,
            "export_path": str(export_path),
            "message": f"Export started for {export_request.format} format"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to export annotations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export annotations: {str(e)}")

@router.post("/v1/annotations/tasks/{task_id}/pre-label", response_model=Dict[str, Any])
async def pre_label_with_yolo_e(
    task_id: str,
    model_name: str = Form("yoloe-11s-seg-pf.pt"),
    confidence_threshold: float = Form(0.5),
    use_gpu: bool = Form(False),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Pre-label images using YOLO-E model predictions with enhanced processing"""
    try:
        task = db.query(AnnotationTask).filter(AnnotationTask.id == task_id).first()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Get project labels for mapping
        project = db.query(AnnotationProject).filter(AnnotationProject.id == task.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Background pre-labeling
        background_tasks.add_task(
            pre_label_images_background,
            task_id,
            model_name,
            confidence_threshold,
            use_gpu,
            project.labels
        )
        
        return {
            "status": "success",
            "message": f"Pre-labeling started with {model_name}",
            "model": model_name,
            "confidence_threshold": confidence_threshold,
            "total_images": len(task.images) if task.images else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start pre-labeling: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start pre-labeling: {str(e)}")

@router.get("/v1/annotations/stats", response_model=AnnotationStatsResponse)
async def get_annotation_stats(
    team_id: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    db = Depends(get_db)
) -> AnnotationStatsResponse:
    """Get comprehensive annotation statistics"""
    try:
        # Base queries
        projects_query = db.query(AnnotationProject)
        tasks_query = db.query(AnnotationTask)
        annotations_query = db.query(Annotation)
        
        # Apply filters
        if team_id:
            projects_query = projects_query.filter(AnnotationProject.team_id == team_id)
            tasks_query = tasks_query.join(AnnotationProject).filter(AnnotationProject.team_id == team_id)
            annotations_query = annotations_query.join(AnnotationTask).join(AnnotationProject).filter(AnnotationProject.team_id == team_id)
        
        if project_id:
            tasks_query = tasks_query.filter(AnnotationTask.project_id == project_id)
            annotations_query = annotations_query.join(AnnotationTask).filter(AnnotationTask.project_id == project_id)
        
        # Calculate statistics
        total_projects = projects_query.count()
        total_tasks = tasks_query.count()
        total_annotations = annotations_query.count()
        
        # Completion rate
        completed_tasks = tasks_query.filter(AnnotationTask.status == "completed").count()
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Average quality score
        quality_scores = [task.quality_score for task in tasks_query.filter(AnnotationTask.quality_score.isnot(None)).all()]
        average_quality_score = np.mean(quality_scores) if quality_scores else 0
        
        # Pending reviews
        pending_reviews = annotations_query.filter(Annotation.review_status == "pending").count()
        
        # Team statistics
        team_stats = {}
        if team_id:
            team_projects = db.query(AnnotationProject).filter(AnnotationProject.team_id == team_id).all()
            team_stats = {
                "total_projects": len(team_projects),
                "active_projects": len([p for p in team_projects if p.status == "active"]),
                "team_members": len(set([p.owner_id for p in team_projects if p.owner_id]))
            }
        
        return AnnotationStatsResponse(
            total_projects=total_projects,
            total_tasks=total_tasks,
            total_annotations=total_annotations,
            completion_rate=completion_rate,
            average_quality_score=average_quality_score,
            pending_reviews=pending_reviews,
            team_stats=team_stats
        )
        
    except Exception as e:
        logger.error(f"Failed to get annotation stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get annotation stats: {str(e)}")

# Additional utility functions
def pre_label_images_background(task_id: str, model_name: str, confidence_threshold: float, use_gpu: bool, labels: List[Dict]):
    """Background task for pre-labeling images"""
    try:
        # Implementation for YOLO-E pre-labeling
        logger.info(f"Starting pre-labeling for task {task_id} with {model_name}")
        
        # This would integrate with the YOLO-E inference system
                    # For now, we'll create a placeholder structure
        
        logger.info(f"Completed pre-labeling for task {task_id}")
    except Exception as e:
        logger.error(f"Error in pre-labeling for task {task_id}: {e}")

# Legacy endpoints for backward compatibility
@router.post("/v1/annotations/projects/form")
async def create_annotation_project_form(
    project_name: str = Form(...),
    description: str = Form(""),
    labels_json: str = Form("[]")
) -> Dict[str, Any]:
    """Legacy endpoint for form-based project creation"""
    try:
        labels = json.loads(labels_json) if labels_json else []
        
        project_data = AnnotationProjectCreate(
            name=project_name,
            description=description,
            labels=labels
        )
        
        # Use the new endpoint
        return await create_annotation_project(project_data, BackgroundTasks(), next(get_db()))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

class CreateProjectRequest(BaseModel):
    project_name: str
    description: Optional[str] = None
    labels: List[str] = []

@router.post("/v1/annotations/projects/json")
async def create_annotation_project_json(request: CreateProjectRequest) -> Dict[str, Any]:
    """Legacy endpoint for JSON-based project creation"""
    try:
        project_data = AnnotationProjectCreate(
            name=request.project_name,
            description=request.description,
            labels=request.labels
        )
        
        # Use the new endpoint
        return await create_annotation_project(project_data, BackgroundTasks(), next(get_db()))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

# Initialize database tables
def init_database():
    """Initialize database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

# CVAT Integration Endpoints

@router.post("/v1/annotations/cvat/projects", response_model=Dict[str, Any])
async def create_cvat_project(
    project_name: str = Form(...),
    labels_json: str = Form("[]"),
    assignee: Optional[str] = Form(None),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new CVAT project and sync with EYE system"""
    try:
        cvat = await get_cvat_service()
        
        # Parse labels
        labels = json.loads(labels_json) if labels_json else []
        
        # Create CVAT project
        cvat_project = await cvat.create_project(project_name, labels, assignee)
        
        if not cvat_project:
            raise HTTPException(status_code=500, detail="Failed to create CVAT project")
        
        # Create corresponding EYE project
        eye_project_data = AnnotationProjectCreate(
            name=f"{project_name} (CVAT)",
            description=f"CVAT project: {project_name}",
            labels=labels,
            settings={"cvat_project_id": cvat_project.id, "cvat_url": CVAT_URL}
        )
        
        # Use existing project creation endpoint
        eye_project = await create_annotation_project(eye_project_data, BackgroundTasks(), db)
        
        return {
            "status": "success",
            "cvat_project": {
                "id": cvat_project.id,
                "name": cvat_project.name,
                "url": cvat_project.url
            },
            "eye_project": eye_project["project"],
            "message": f"CVAT project '{project_name}' created and synced with EYE"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create CVAT project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create CVAT project: {str(e)}")

@router.post("/v1/annotations/cvat/tasks", response_model=Dict[str, Any])
async def create_cvat_task(
    project_id: str = Form(...),
    task_name: str = Form(...),
    files: List[UploadFile] = File(...),
    assignee: Optional[str] = Form(None),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new CVAT task with images and sync with EYE system"""
    try:
        cvat = await get_cvat_service()
        
        # Get EYE project
        eye_project = db.query(AnnotationProject).filter(AnnotationProject.id == project_id).first()
        if not eye_project:
            raise HTTPException(status_code=404, detail="EYE project not found")
        
        # Get CVAT project ID from settings
        cvat_project_id = eye_project.settings.get("cvat_project_id")
        if not cvat_project_id:
            raise HTTPException(status_code=400, detail="Project not linked to CVAT")
        
        # Save uploaded images temporarily
        temp_images = []
        temp_dir = TEMP_DIR / f"cvat_{uuid.uuid4().hex}"
        temp_dir.mkdir(exist_ok=True)
        
        try:
            for file in files:
                if file.content_type and file.content_type.startswith("image/"):
                    image_path = temp_dir / file.filename
                    content = await file.read()
                    with open(image_path, "wb") as buffer:
                        buffer.write(content)
                    temp_images.append(image_path)
            
            if not temp_images:
                raise HTTPException(status_code=400, detail="No valid images uploaded")
            
            # Create CVAT task
            cvat_task = await cvat.create_task(
                task_name, 
                cvat_project_id, 
                temp_images, 
                eye_project.labels,
                assignee
            )
            
            if not cvat_task:
                raise HTTPException(status_code=500, detail="Failed to create CVAT task")
            
            # Create corresponding EYE task
            eye_task_data = AnnotationTaskCreate(
                project_id=project_id,
                name=f"{task_name} (CVAT)",
                description=f"CVAT task: {task_name}",
                assigned_to=assignee,
                metadata={"cvat_task_id": cvat_task.id, "cvat_url": CVAT_URL}
            )
            
            # Use existing task creation endpoint
            eye_task = await create_annotation_task(eye_task_data, files, BackgroundTasks(), db)
            
            return {
                "status": "success",
                "cvat_task": {
                    "id": cvat_task.id,
                    "name": cvat_task.name,
                    "url": cvat_task.url,
                    "size": cvat_task.size
                },
                "eye_task": eye_task["task"],
                "message": f"CVAT task '{task_name}' created and synced with EYE"
            }
            
        finally:
            # Cleanup temporary files
            try:
                shutil.rmtree(temp_dir)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp directory: {e}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create CVAT task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create CVAT task: {str(e)}")

@router.get("/v1/annotations/cvat/tasks/{task_id}/annotations", response_model=Dict[str, Any])
async def get_cvat_annotations(
    task_id: str,
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Get annotations from CVAT task"""
    try:
        # Get EYE task
        eye_task = db.query(AnnotationTask).filter(AnnotationTask.id == task_id).first()
        if not eye_task:
            raise HTTPException(status_code=404, detail="EYE task not found")
        
        # Get CVAT task ID from metadata
        cvat_task_id = eye_task.task_metadata.get("cvat_task_id")
        if not cvat_task_id:
            raise HTTPException(status_code=400, detail="Task not linked to CVAT")
        
        cvat = await get_cvat_service()
        
        # Get annotations from CVAT
        cvat_annotations = await cvat.get_task_annotations(cvat_task_id)
        
        if not cvat_annotations:
            raise HTTPException(status_code=404, detail="No annotations found in CVAT")
        
        return {
            "status": "success",
            "annotations": cvat_annotations,
            "task_id": task_id,
            "cvat_task_id": cvat_task_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get CVAT annotations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get CVAT annotations: {str(e)}")

@router.post("/v1/annotations/cvat/tasks/{task_id}/sync", response_model=Dict[str, Any])
async def sync_cvat_annotations(
    task_id: str,
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Sync annotations from CVAT to EYE system"""
    try:
        # Get EYE task
        eye_task = db.query(AnnotationTask).filter(AnnotationTask.id == task_id).first()
        if not eye_task:
            raise HTTPException(status_code=404, detail="EYE task not found")
        
        # Get CVAT task ID from metadata
        cvat_task_id = eye_task.task_metadata.get("cvat_task_id")
        if not cvat_task_id:
            raise HTTPException(status_code=400, detail="Task not linked to CVAT")
        
        cvat = await get_cvat_service()
        
        # Sync annotations
        sync_success = await cvat.sync_annotations_to_eye(cvat_task_id, task_id)
        
        if not sync_success:
            raise HTTPException(status_code=500, detail="Failed to sync annotations")
        
        # Update EYE task status
        eye_task.status = "completed"
        eye_task.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "status": "success",
            "message": f"Annotations synced from CVAT task {cvat_task_id} to EYE task {task_id}",
            "task_id": task_id,
            "cvat_task_id": cvat_task_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to sync CVAT annotations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync CVAT annotations: {str(e)}")

@router.post("/v1/annotations/cvat/tasks/{task_id}/export", response_model=Dict[str, Any])
async def export_cvat_annotations(
    task_id: str,
    format: str = Form("COCO 1.0"),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Export annotations from CVAT task"""
    try:
        # Get EYE task
        eye_task = db.query(AnnotationTask).filter(AnnotationTask.id == task_id).first()
        if not eye_task:
            raise HTTPException(status_code=404, detail="EYE task not found")
        
        # Get CVAT task ID from metadata
        cvat_task_id = eye_task.task_metadata.get("cvat_task_id")
        if not cvat_task_id:
            raise HTTPException(status_code=400, detail="Task not linked to CVAT")
        
        cvat = await get_cvat_service()
        
        # Export annotations from CVAT
        export_data = await cvat.export_annotations(cvat_task_id, format)
        
        if not export_data:
            raise HTTPException(status_code=500, detail="Failed to export annotations from CVAT")
        
        # Save export file
        export_dir = EXPORTS_DIR / task_id
        export_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_filename = f"cvat_annotations_{format.replace(' ', '_')}_{timestamp}"
        
        if format.startswith("COCO"):
            export_path = export_dir / f"{export_filename}.json"
            with open(export_path, "wb") as f:
                f.write(export_data)
        else:
            export_path = export_dir / f"{export_filename}.zip"
            with open(export_path, "wb") as f:
                f.write(export_data)
        
        return {
            "status": "success",
            "format": format,
            "export_path": str(export_path),
            "message": f"Annotations exported from CVAT in {format} format"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to export CVAT annotations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export CVAT annotations: {str(e)}")

@router.get("/v1/annotations/cvat/tasks/{task_id}/progress", response_model=Dict[str, Any])
async def get_cvat_task_progress(
    task_id: str,
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Get CVAT task progress"""
    try:
        # Get EYE task
        eye_task = db.query(AnnotationTask).filter(AnnotationTask.id == task_id).first()
        if not eye_task:
            raise HTTPException(status_code=404, detail="EYE task not found")
        
        # Get CVAT task ID from metadata
        cvat_task_id = eye_task.task_metadata.get("cvat_task_id")
        if not cvat_task_id:
            raise HTTPException(status_code=400, detail="Task not linked to CVAT")
        
        cvat = await get_cvat_service()
        
        # Get progress from CVAT
        progress_data = await cvat.get_task_progress(cvat_task_id)
        
        if not progress_data:
            raise HTTPException(status_code=404, detail="Failed to get CVAT task progress")
        
        return {
            "status": "success",
            "progress": progress_data,
            "task_id": task_id,
            "cvat_task_id": cvat_task_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get CVAT task progress: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get CVAT task progress: {str(e)}")

@router.post("/v1/annotations/cvat/webhook", response_model=Dict[str, Any])
async def handle_cvat_webhook(
    request: Request,
    db = Depends(get_db)
) -> Dict[str, Any]:
    """Handle CVAT webhook events"""
    try:
        webhook_data = await request.json()
        event_type = webhook_data.get("event_type")
        
        if event_type == "task_updated":
            task_id = webhook_data.get("task_id")
            status = webhook_data.get("status")
            
            # Find corresponding EYE task
            eye_task = db.query(AnnotationTask).filter(
                AnnotationTask.task_metadata["cvat_task_id"].astext == str(task_id)
            ).first()
            
            if eye_task:
                # Update EYE task status
                eye_task.status = status
                eye_task.updated_at = datetime.utcnow()
                db.commit()
                
                # If completed, sync annotations
                if status == "completed":
                    cvat = await get_cvat_service()
                    await cvat.sync_annotations_to_eye(task_id, str(eye_task.id))
                
                logger.info(f"Updated EYE task {eye_task.id} from CVAT webhook: {status}")
        
        return {
            "status": "success",
            "message": f"Webhook event '{event_type}' processed successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to handle CVAT webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to handle CVAT webhook: {str(e)}")

# Call initialization
init_database()
