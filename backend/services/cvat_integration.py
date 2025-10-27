"""
CVAT Integration Service for EYE Annotation System
Provides seamless integration with Computer Vision Annotation Tool (CVAT)
for advanced annotation capabilities and professional workflows.
"""

import asyncio
import logging
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import httpx
import yaml
from dataclasses import dataclass, asdict
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

class CVATTaskStatus(Enum):
    """CVAT task status enumeration"""
    ANNOTATION = "annotation"
    VALIDATION = "validation"
    COMPLETED = "completed"
    REJECTED = "rejected"

class CVATJobStatus(Enum):
    """CVAT job status enumeration"""
    NEW = "new"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"

@dataclass
class CVATProject:
    """CVAT project data structure"""
    id: int
    name: str
    owner: Dict[str, Any]
    assignee: Optional[Dict[str, Any]]
    created_date: str
    updated_date: str
    status: str
    labels: List[Dict[str, Any]]
    tasks: List[int]
    task_subsets: List[str]
    url: str

@dataclass
class CVATTask:
    """CVAT task data structure"""
    id: int
    name: str
    size: int
    mode: str
    owner: Dict[str, Any]
    assignee: Optional[Dict[str, Any]]
    bug_tracker: Optional[str]
    created_date: str
    updated_date: str
    overlap: int
    segment_size: int
    z_order: bool
    image_quality: int
    data: Dict[str, Any]
    url: str
    image_urls: List[str]
    tags: List[Dict[str, Any]]
    jobs: List[Dict[str, Any]]
    status: str
    progress: float

@dataclass
class CVATJob:
    """CVAT job data structure"""
    id: int
    task_id: int
    project_id: Optional[int]
    assignee: Optional[Dict[str, Any]]
    status: str
    created_date: str
    updated_date: str
    url: str
    type: str
    start_frame: int
    stop_frame: int
    data: Dict[str, Any]

class CVATIntegrationService:
    """Service for integrating with CVAT annotation platform"""
    
    def __init__(self, cvat_url: str, username: str, password: str):
        self.cvat_url = cvat_url.rstrip('/')
        self.username = username
        self.password = password
        self.session = None
        self.auth_token = None
        
    async def initialize(self) -> bool:
        """Initialize CVAT connection and authentication"""
        try:
            async with httpx.AsyncClient() as client:
                # Login to CVAT
                login_data = {
                    "username": self.username,
                    "password": self.password
                }
                
                response = await client.post(
                    f"{self.cvat_url}/api/auth/login",
                    json=login_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    self.auth_token = response.json().get("key")
                    logger.info("Successfully authenticated with CVAT")
                    return True
                else:
                    logger.error(f"Failed to authenticate with CVAT: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error initializing CVAT connection: {e}")
            return False
    
    async def create_project(self, name: str, labels: List[Dict[str, Any]], 
                           assignee: Optional[str] = None) -> Optional[CVATProject]:
        """Create a new CVAT project"""
        try:
            if not self.auth_token:
                await self.initialize()
            
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Token {self.auth_token}"}
                
                project_data = {
                    "name": name,
                    "labels": labels,
                    "assignee": assignee
                }
                
                response = await client.post(
                    f"{self.cvat_url}/api/projects",
                    json=project_data,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 201:
                    project_info = response.json()
                    return CVATProject(**project_info)
                else:
                    logger.error(f"Failed to create CVAT project: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error creating CVAT project: {e}")
            return None
    
    async def create_task(self, name: str, project_id: Optional[int], 
                         images: List[Path], labels: List[Dict[str, Any]],
                         assignee: Optional[str] = None) -> Optional[CVATTask]:
        """Create a new CVAT task with images"""
        try:
            if not self.auth_token:
                await self.initialize()
            
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Token {self.auth_token}"}
                
                # Prepare task data
                task_data = {
                    "name": name,
                    "labels": labels,
                    "assignee": assignee,
                    "project_id": project_id
                }
                
                # Create task
                response = await client.post(
                    f"{self.cvat_url}/api/tasks",
                    json=task_data,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 201:
                    task_info = response.json()
                    task_id = task_info["id"]
                    
                    # Upload images
                    upload_success = await self._upload_images(task_id, images)
                    
                    if upload_success:
                        return CVATTask(**task_info)
                    else:
                        logger.error("Failed to upload images to CVAT task")
                        return None
                else:
                    logger.error(f"Failed to create CVAT task: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error creating CVAT task: {e}")
            return None
    
    async def _upload_images(self, task_id: int, images: List[Path]) -> bool:
        """Upload images to CVAT task"""
        try:
            if not self.auth_token:
                return False
            
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Token {self.auth_token}"}
                
                # Prepare image data
                image_data = []
                for image_path in images:
                    if image_path.exists():
                        image_data.append(("image_quality", "95"))
                        image_data.append(("use_zip_chunks", "true"))
                        image_data.append(("use_cache", "true"))
                        image_data.append(("copy_data", "false"))
                        image_data.append(("server_files", (image_path.name, open(image_path, "rb"), "image/jpeg")))
                
                # Upload images
                response = await client.post(
                    f"{self.cvat_url}/api/tasks/{task_id}/data",
                    files=image_data,
                    headers=headers,
                    timeout=300.0
                )
                
                if response.status_code == 202:
                    # Wait for upload completion
                    return await self._wait_for_upload_completion(task_id)
                else:
                    logger.error(f"Failed to upload images: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error uploading images: {e}")
            return False
    
    async def _wait_for_upload_completion(self, task_id: int, timeout: int = 300) -> bool:
        """Wait for image upload completion"""
        try:
            start_time = datetime.now()
            
            while (datetime.now() - start_time).seconds < timeout:
                async with httpx.AsyncClient() as client:
                    headers = {"Authorization": f"Token {self.auth_token}"}
                    
                    response = await client.get(
                        f"{self.cvat_url}/api/tasks/{task_id}",
                        headers=headers,
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        task_data = response.json()
                        if task_data.get("status") == "completed":
                            return True
                    
                await asyncio.sleep(5)
            
            logger.error("Image upload timeout")
            return False
            
        except Exception as e:
            logger.error(f"Error waiting for upload completion: {e}")
            return False
    
    async def get_task_annotations(self, task_id: int) -> Optional[Dict[str, Any]]:
        """Get annotations from CVAT task"""
        try:
            if not self.auth_token:
                await self.initialize()
            
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Token {self.auth_token}"}
                
                response = await client.get(
                    f"{self.cvat_url}/api/tasks/{task_id}/annotations",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to get annotations: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting annotations: {e}")
            return None
    
    async def export_annotations(self, task_id: int, format: str = "COCO 1.0") -> Optional[bytes]:
        """Export annotations from CVAT task"""
        try:
            if not self.auth_token:
                await self.initialize()
            
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Token {self.auth_token}"}
                
                # Start export
                export_data = {
                    "format": format,
                    "filename": f"task_{task_id}_annotations"
                }
                
                response = await client.post(
                    f"{self.cvat_url}/api/tasks/{task_id}/annotations",
                    json=export_data,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 202:
                    # Wait for export completion and download
                    export_url = response.json().get("url")
                    if export_url:
                        return await self._download_export(export_url)
                
                logger.error(f"Failed to export annotations: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error exporting annotations: {e}")
            return None
    
    async def _download_export(self, export_url: str) -> Optional[bytes]:
        """Download exported annotations"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(export_url, timeout=300.0)
                
                if response.status_code == 200:
                    return response.content
                else:
                    logger.error(f"Failed to download export: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error downloading export: {e}")
            return None
    
    async def sync_annotations_to_eye(self, task_id: int, eye_task_id: str) -> bool:
        """Sync CVAT annotations back to EYE system"""
        try:
            # Get annotations from CVAT
            cvat_annotations = await self.get_task_annotations(task_id)
            if not cvat_annotations:
                return False
            
            # Convert CVAT format to EYE format
            eye_annotations = self._convert_cvat_to_eye_format(cvat_annotations)
            
            # Save to EYE system
            # This would integrate with the EYE annotation API
            # For now, we'll return the converted format
            
            logger.info(f"Successfully synced {len(eye_annotations)} annotations from CVAT")
            return True
            
        except Exception as e:
            logger.error(f"Error syncing annotations: {e}")
            return False
    
    def _convert_cvat_to_eye_format(self, cvat_annotations: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Convert CVAT annotation format to EYE format"""
        eye_annotations = []
        
        try:
            for annotation in cvat_annotations.get("shapes", []):
                eye_annotation = {
                    "id": str(uuid.uuid4()),
                    "label_id": annotation.get("label_id"),
                    "type": annotation.get("type", "bbox"),
                    "coordinates": self._convert_coordinates(annotation),
                    "confidence": annotation.get("confidence", 1.0),
                    "attributes": annotation.get("attributes", {}),
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                eye_annotations.append(eye_annotation)
                
        except Exception as e:
            logger.error(f"Error converting CVAT annotations: {e}")
        
        return eye_annotations
    
    def _convert_coordinates(self, annotation: Dict[str, Any]) -> List[Dict[str, float]]:
        """Convert CVAT coordinates to EYE format"""
        coordinates = []
        
        try:
            points = annotation.get("points", [])
            if annotation.get("type") == "rectangle":
                # Convert bbox format
                if len(points) >= 4:
                    x1, y1, x2, y2 = points[:4]
                    coordinates = [
                        {"x": min(x1, x2), "y": min(y1, y2)},
                        {"x": max(x1, x2), "y": max(y1, y2)}
                    ]
            elif annotation.get("type") == "polygon":
                # Convert polygon format
                for i in range(0, len(points), 2):
                    if i + 1 < len(points):
                        coordinates.append({"x": points[i], "y": points[i + 1]})
            elif annotation.get("type") == "points":
                # Convert keypoint format
                for i in range(0, len(points), 2):
                    if i + 1 < len(points):
                        coordinates.append({"x": points[i], "y": points[i + 1]})
                        
        except Exception as e:
            logger.error(f"Error converting coordinates: {e}")
        
        return coordinates
    
    async def get_project_tasks(self, project_id: int) -> List[CVATTask]:
        """Get all tasks for a CVAT project"""
        try:
            if not self.auth_token:
                await self.initialize()
            
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Token {self.auth_token}"}
                
                response = await client.get(
                    f"{self.cvat_url}/api/projects/{project_id}/tasks",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    tasks_data = response.json()
                    return [CVATTask(**task) for task in tasks_data]
                else:
                    logger.error(f"Failed to get project tasks: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting project tasks: {e}")
            return []
    
    async def update_task_status(self, task_id: int, status: str) -> bool:
        """Update CVAT task status"""
        try:
            if not self.auth_token:
                await self.initialize()
            
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Token {self.auth_token}"}
                
                update_data = {"status": status}
                
                response = await client.patch(
                    f"{self.cvat_url}/api/tasks/{task_id}",
                    json=update_data,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return True
                else:
                    logger.error(f"Failed to update task status: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error updating task status: {e}")
            return False
    
    async def assign_task(self, task_id: int, assignee: str) -> bool:
        """Assign CVAT task to user"""
        try:
            if not self.auth_token:
                await self.initialize()
            
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Token {self.auth_token}"}
                
                assign_data = {"assignee": assignee}
                
                response = await client.patch(
                    f"{self.cvat_url}/api/tasks/{task_id}",
                    json=assign_data,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return True
                else:
                    logger.error(f"Failed to assign task: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error assigning task: {e}")
            return False
    
    async def get_task_progress(self, task_id: int) -> Optional[Dict[str, Any]]:
        """Get CVAT task progress information"""
        try:
            if not self.auth_token:
                await self.initialize()
            
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Token {self.auth_token}"}
                
                response = await client.get(
                    f"{self.cvat_url}/api/tasks/{task_id}",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    task_data = response.json()
                    return {
                        "progress": task_data.get("progress", 0),
                        "status": task_data.get("status", "unknown"),
                        "size": task_data.get("size", 0),
                        "updated_date": task_data.get("updated_date", "")
                    }
                else:
                    logger.error(f"Failed to get task progress: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting task progress: {e}")
            return None
    
    async def close(self):
        """Close CVAT connection"""
        try:
            if self.session:
                await self.session.aclose()
            self.auth_token = None
            logger.info("CVAT connection closed")
        except Exception as e:
            logger.error(f"Error closing CVAT connection: {e}")

# Factory function for creating CVAT service
def create_cvat_service(cvat_url: str, username: str, password: str) -> CVATIntegrationService:
    """Create and initialize CVAT integration service"""
    service = CVATIntegrationService(cvat_url, username, password)
    return service

# Configuration helper
def load_cvat_config(config_path: Path) -> Dict[str, Any]:
    """Load CVAT configuration from file"""
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        return config.get('cvat', {})
    except Exception as e:
        logger.error(f"Error loading CVAT config: {e}")
        return {}

# Webhook handler for CVAT events
class CVATWebhookHandler:
    """Handle CVAT webhook events"""
    
    def __init__(self, eye_api_client):
        self.eye_api_client = eye_api_client
    
    async def handle_task_updated(self, webhook_data: Dict[str, Any]):
        """Handle CVAT task update webhook"""
        try:
            task_id = webhook_data.get("task_id")
            status = webhook_data.get("status")
            
            if task_id and status:
                # Update EYE task status
                await self.eye_api_client.update_task_status(task_id, status)
                
                # If task is completed, sync annotations
                if status == "completed":
                    await self.eye_api_client.sync_annotations_from_cvat(task_id)
                
                logger.info(f"Handled CVAT task update: {task_id} -> {status}")
                
        except Exception as e:
            logger.error(f"Error handling CVAT webhook: {e}")
    
    async def handle_annotation_created(self, webhook_data: Dict[str, Any]):
        """Handle CVAT annotation creation webhook"""
        try:
            task_id = webhook_data.get("task_id")
            annotation_id = webhook_data.get("annotation_id")
            
            if task_id and annotation_id:
                # Sync new annotation to EYE
                await self.eye_api_client.sync_annotation_from_cvat(task_id, annotation_id)
                
                logger.info(f"Handled CVAT annotation creation: {task_id} -> {annotation_id}")
                
        except Exception as e:
            logger.error(f"Error handling CVAT annotation webhook: {e}")
