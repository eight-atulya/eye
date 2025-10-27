"""
Memory Processing Service

This service handles the complete pipeline for processing uploaded images:
1. YOLO-E object detection
2. LLM processing with system prompts
3. Embedding generation
4. FAISS indexing

Author: Anurag Atulya — EYE for Humanity
"""

import asyncio
import base64
import httpx
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

@dataclass
class ProcessingJob:
    """Memory processing job"""
    job_id: str
    memory_id: str
    image_uuid: str
    image_data: bytes
    user_tags: List[str]
    user_notes: Optional[str]
    status: str = "queued"
    created_at: datetime = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    yolo_results: Optional[Dict] = None
    llm_description: Optional[str] = None
    embedding: Optional[List[float]] = None

class MemoryProcessingService:
    """Service for processing memory images through the complete pipeline"""
    
    def __init__(self):
        self.processing_queue: asyncio.Queue = asyncio.Queue()
        self.active_jobs: Dict[str, ProcessingJob] = {}
        self.completed_jobs: Dict[str, ProcessingJob] = {}
        self.http_client: Optional[httpx.AsyncClient] = None
        self.is_running = False
        
    async def initialize(self):
        """Initialize the processing service"""
        self.http_client = httpx.AsyncClient(timeout=30.0)
        self.is_running = True
        
        # Start the processing worker
        asyncio.create_task(self._process_queue())
        
    async def close(self):
        """Close the processing service"""
        self.is_running = False
        if self.http_client:
            await self.http_client.aclose()
    
    async def queue_memory_processing(
        self,
        memory_id: str,
        image_uuid: str,
        image_data: bytes,
        user_tags: List[str],
        user_notes: Optional[str] = None
    ) -> str:
        """Queue a memory for processing"""
        job_id = str(uuid.uuid4())
        
        job = ProcessingJob(
            job_id=job_id,
            memory_id=memory_id,
            image_uuid=image_uuid,
            image_data=image_data,
            user_tags=user_tags,
            user_notes=user_notes,
            created_at=datetime.utcnow()
        )
        
        self.active_jobs[job_id] = job
        await self.processing_queue.put(job)
        
        logger.info(f"Queued memory processing job {job_id} for memory {memory_id}")
        return job_id
    
    async def get_job_status(self, job_id: str) -> Optional[ProcessingJob]:
        """Get the status of a processing job"""
        if job_id in self.active_jobs:
            return self.active_jobs[job_id]
        elif job_id in self.completed_jobs:
            return self.completed_jobs[job_id]
        return None
    
    async def _process_queue(self):
        """Background worker to process the queue"""
        while self.is_running:
            try:
                # Wait for a job with timeout
                job = await asyncio.wait_for(self.processing_queue.get(), timeout=1.0)
                
                # Process the job
                await self._process_job(job)
                
            except asyncio.TimeoutError:
                # No jobs in queue, continue
                continue
            except Exception as e:
                logger.error(f"Error in processing queue: {e}")
                await asyncio.sleep(1)
    
    async def _process_job(self, job: ProcessingJob):
        """Process a single memory job through the complete pipeline"""
        try:
            logger.info(f"Starting processing job {job.job_id}")
            job.status = "processing"
            job.started_at = datetime.utcnow()
            
            # Step 1: YOLO-E Object Detection
            logger.info(f"Running YOLO-E detection for job {job.job_id}")
            yolo_results = await self._run_yolo_detection(job.image_data)
            job.yolo_results = yolo_results
            
            # Step 2: LLM Processing with System Prompt
            logger.info(f"Running LLM processing for job {job.job_id}")
            llm_description = await self._run_llm_processing(job.image_data, yolo_results)
            job.llm_description = llm_description
            
            # Step 3: Generate Embedding
            logger.info(f"Generating embedding for job {job.job_id}")
            embedding = await self._generate_embedding(llm_description)
            job.embedding = embedding
            
            # Step 4: Update Database
            logger.info(f"Updating database for job {job.job_id}")
            await self._update_memory_record(job)
            
            # Mark as completed
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            
            # Move to completed jobs
            self.completed_jobs[job.job_id] = job
            del self.active_jobs[job.job_id]
            
            logger.info(f"Completed processing job {job.job_id}")
            
        except Exception as e:
            logger.error(f"Error processing job {job.job_id}: {e}")
            job.status = "failed"
            job.error = str(e)
            job.completed_at = datetime.utcnow()
            
            # Move to completed jobs (failed)
            self.completed_jobs[job.job_id] = job
            del self.active_jobs[job.job_id]
    
    async def _run_yolo_detection(self, image_data: bytes) -> Dict[str, Any]:
        """Run YOLO-E object detection on the image"""
        try:
            # Create a temporary file-like object for the image data
            import io
            
            # Call YOLO-E inference endpoint with file upload
            files = {"file": ("image.jpg", io.BytesIO(image_data), "image/jpeg")}
            data = {
                "model_path": "yoloe-11s-seg-pf.pt",
                "confidence_threshold": 0.5,
                "iou_threshold": 0.45,
                "use_gpu": "true"
            }
            
            response = await self.http_client.post(
                "http://backend:8001/api/v1/yolo-e/infer/single",
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "detections": result.get("detections", []),
                    "objects": result.get("objects", []),
                    "confidence_scores": result.get("confidence_scores", []),
                    "model_used": result.get("model", "yoloe-11s-seg-pf.pt")
                }
            else:
                logger.warning(f"YOLO-E detection failed: {response.status_code}")
                return {"detections": [], "objects": [], "confidence_scores": [], "model_used": "none"}
                
        except Exception as e:
            logger.error(f"YOLO-E detection error: {e}")
            return {"detections": [], "objects": [], "confidence_scores": [], "model_used": "none", "error": str(e)}
    
    async def _run_llm_processing(self, image_data: bytes, yolo_results: Dict[str, Any]) -> str:
        """Run LLM processing with system prompt and YOLO results"""
        try:
            # Convert image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Create comprehensive system prompt
            system_prompt = """You are EYE AI, an advanced memory analysis system. Your task is to analyze images and provide comprehensive descriptions that will help users find and understand their memories.

For each image, provide:
1. A detailed visual description of what you see
2. The objects, people, and scenes present
3. The mood, atmosphere, and emotional context
4. Any notable features, colors, or details
5. The overall context and setting

Be specific, descriptive, and helpful for memory search and retrieval. Focus on details that would help someone remember this moment."""

            # Create user prompt with YOLO results
            detected_objects = yolo_results.get("objects", [])
            yolo_context = ""
            if detected_objects:
                yolo_context = f"\n\nYOLO-E detected objects: {', '.join(detected_objects)}"
            
            user_prompt = f"What do you see in this image? Please provide a comprehensive description that captures the visual content, objects, people, setting, mood, and any notable details.{yolo_context}"
            
            # Call Ollama vision chat using the correct API format
            messages = [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user", 
                    "content": user_prompt,
                    "images": [image_base64]
                }
            ]
            
            response = await self.http_client.post(
                "http://ollama:11434/api/chat",
                json={
                    "model": "llava:7b",
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "top_p": 0.9
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("message", {}).get("content", "No description available")
            else:
                logger.warning(f"LLM processing failed: {response.status_code}")
                return "Failed to generate description"
                
        except Exception as e:
            logger.error(f"LLM processing error: {e}")
            return f"Error generating description: {str(e)}"
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for the processed text"""
        try:
            import hashlib
            
            # Create a comprehensive text for embedding
            embedding_text = f"{text} memory image description"
            
            # Generate hash-based embedding (in production, use proper embedding model)
            hash_obj = hashlib.md5(embedding_text.encode())
            hash_bytes = hash_obj.digest()
            
            # Create 384-dimensional embedding
            embedding = []
            for i in range(384):
                byte_idx = i % len(hash_bytes)
                embedding.append(float(hash_bytes[byte_idx]) / 255.0)
            
            return embedding
            
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            return [0.0] * 384
    
    async def _update_memory_record(self, job: ProcessingJob):
        """Update the memory record in the database with processing results"""
        try:
            # This would update the database record with:
            # - AI description (from LLM)
            # - Detected objects (from YOLO-E)
            # - Embedding vector
            # - Processing status
            
            # For now, we'll use a simple HTTP call to update the record
            update_data = {
                "ai_description": job.llm_description,
                "detected_objects": job.yolo_results.get("objects", []),
                "scene_context": "Processed with YOLO-E + LLM pipeline",
                "emotional_context": "Analyzed for memory context",
                "processing_status": "completed",
                "embedding": job.embedding
            }
            
            # Call memory service to update the record
            response = await self.http_client.patch(
                f"http://backend:8001/api/v1/memory/memories/{job.memory_id}",
                json=update_data
            )
            
            if response.status_code != 200:
                logger.warning(f"Failed to update memory record: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error updating memory record: {e}")

# Global instance
_memory_processing_service: Optional[MemoryProcessingService] = None

def get_memory_processing_service() -> MemoryProcessingService:
    """Get the global memory processing service instance"""
    global _memory_processing_service
    if _memory_processing_service is None:
        _memory_processing_service = MemoryProcessingService()
    return _memory_processing_service

async def cleanup_memory_processing_service():
    """Cleanup the memory processing service"""
    global _memory_processing_service
    if _memory_processing_service:
        await _memory_processing_service.close()
        _memory_processing_service = None
