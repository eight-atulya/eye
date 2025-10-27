"""
EYE Memory System - Intelligent Memory Preservation and Retrieval

This module implements a comprehensive memory system that:
1. Processes and stores images in MinIO with UUIDs
2. Generates embeddings using default embedding models
3. Stores embeddings in FAISS for fast retrieval
4. Provides intelligent memory search and retrieval
5. Integrates with EYE AI for contextual conversations

Author: Anurag Atulya — EYE for Humanity
"""

import uuid
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path

import httpx
import numpy as np
import faiss
from minio import Minio
from minio.error import S3Error
import base64
from PIL import Image
import io

from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, Text, JSON, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Database Models
Base = declarative_base()

class MemoryRecord(Base):
    __tablename__ = "memory_records"
    
    id = Column(String, primary_key=True)  # UUID
    user_id = Column(String, nullable=False, index=True)
    image_uuid = Column(String, nullable=False, unique=True)
    image_path = Column(String, nullable=False)  # MinIO path
    original_filename = Column(String, nullable=True)
    content_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    
    # Processing metadata
    processing_status = Column(String, default="pending")  # pending, processing, completed, failed
    processing_error = Column(Text, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    
    # AI Analysis results
    ai_description = Column(Text, nullable=True)
    detected_objects = Column(JSON, nullable=True)
    scene_context = Column(Text, nullable=True)
    emotional_context = Column(Text, nullable=True)
    
    # Embedding metadata
    embedding_model = Column(String, nullable=True)
    embedding_dimension = Column(Integer, nullable=True)
    faiss_index_id = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # User annotations
    user_tags = Column(JSON, nullable=True)
    user_notes = Column(Text, nullable=True)
    is_favorite = Column(Boolean, default=False)
    is_private = Column(Boolean, default=False)

# Pydantic Models
class MemoryUploadRequest(BaseModel):
    user_id: str
    image_data: str  # Base64 encoded image
    filename: Optional[str] = None
    user_tags: Optional[List[str]] = None
    user_notes: Optional[str] = None
    is_private: bool = False

class MemorySearchRequest(BaseModel):
    user_id: str
    query: str
    limit: int = Field(default=10, ge=1, le=50)
    include_private: bool = False
    filter_tags: Optional[List[str]] = None
    date_range: Optional[Tuple[datetime, datetime]] = None

class MemoryResponse(BaseModel):
    id: str
    image_uuid: str
    image_url: str
    ai_description: Optional[str]
    detected_objects: Optional[List[str]]
    scene_context: Optional[str]
    emotional_context: Optional[str]
    user_tags: Optional[List[str]]
    user_notes: Optional[str]
    created_at: datetime
    similarity_score: Optional[float] = None

class MemoryJobStatus(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: int = Field(default=0, ge=0, le=100)
    message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None

@dataclass
class MemoryConfig:
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "miniokey"
    minio_secret_key: str = "miniopass123"
    minio_bucket: str = "eye-memories"
    
    faiss_index_path: str = "/app/data/faiss_index"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    
    database_url: str = "postgresql://vision:vision@db:5432/vision"
    
    # Processing settings
    max_image_size: int = 10 * 1024 * 1024  # 10MB
    supported_formats: List[str] = None
    
    def __post_init__(self):
        if self.supported_formats is None:
            self.supported_formats = ["jpg", "jpeg", "png", "gif", "webp", "bmp"]

class MemoryService:
    """Main memory service for EYE system"""
    
    def __init__(self, config: MemoryConfig):
        self.config = config
        self.minio_client = None
        self.faiss_index = None
        self.db_engine = None
        self.db_session = None
        self.embedding_client = None
        self._initialized = False
    
    async def initialize(self) -> bool:
        """Initialize all components of the memory system"""
        if self._initialized:
            return True
            
        try:
            # Initialize MinIO client
            self.minio_client = Minio(
                self.config.minio_endpoint,
                access_key=self.config.minio_access_key,
                secret_key=self.config.minio_secret_key,
                secure=False
            )
            
            # Create bucket if it doesn't exist
            if not self.minio_client.bucket_exists(self.config.minio_bucket):
                self.minio_client.make_bucket(self.config.minio_bucket)
            
            # Initialize database
            self.db_engine = create_engine(self.config.database_url)
            Base.metadata.create_all(self.db_engine)
            Session = sessionmaker(bind=self.db_engine)
            self.db_session = Session()
            
            # Initialize FAISS index
            await self._initialize_faiss_index()
            
            # Initialize embedding client
            self.embedding_client = httpx.AsyncClient(
                base_url="http://ollama:11434",
                timeout=30.0
            )
            
            self._initialized = True
            return True
            
        except Exception as e:
            print(f"Failed to initialize memory service: {e}")
            # Set a flag to prevent repeated initialization attempts
            self._initialized = False
            return False
    
    async def _initialize_faiss_index(self):
        """Initialize or load FAISS index"""
        index_path = Path(self.config.faiss_index_path)
        index_path.parent.mkdir(parents=True, exist_ok=True)
        
        if index_path.exists():
            # Load existing index
            self.faiss_index = faiss.read_index(str(index_path))
        else:
            # Create new index
            self.faiss_index = faiss.IndexFlatIP(self.config.embedding_dimension)
            faiss.write_index(self.faiss_index, str(index_path))
    
    async def upload_memory(self, request: MemoryUploadRequest) -> tuple[str, str]:
        """Upload and process a memory (image)"""
        try:
            # Generate UUIDs
            memory_id = str(uuid.uuid4())
            image_uuid = str(uuid.uuid4())
            
            # Decode and validate image
            image_data = base64.b64decode(request.image_data)
            if len(image_data) > self.config.max_image_size:
                raise ValueError("Image too large")
            
            # Validate image format
            try:
                image = Image.open(io.BytesIO(image_data))
                image_format = image.format.lower()
                if image_format not in self.config.supported_formats:
                    raise ValueError(f"Unsupported format: {image_format}")
            except Exception as e:
                raise ValueError(f"Invalid image: {e}")
            
            # Store image in MinIO
            image_path = f"memories/{request.user_id}/{image_uuid}.{image_format}"
            self.minio_client.put_object(
                self.config.minio_bucket,
                image_path,
                io.BytesIO(image_data),
                length=len(image_data),
                content_type=f"image/{image_format}"
            )
            
            # Create database record
            memory_record = MemoryRecord(
                id=memory_id,
                user_id=request.user_id,
                image_uuid=image_uuid,
                image_path=image_path,
                original_filename=request.filename,
                content_type=f"image/{image_format}",
                file_size=len(image_data),
                user_tags=request.user_tags or [],
                user_notes=request.user_notes,
                is_private=request.is_private,
                processing_status="pending"
            )
            
            self.db_session.add(memory_record)
            self.db_session.commit()
            
            return memory_id, image_uuid
            
        except Exception as e:
            print(f"Failed to upload memory: {e}")
            raise
    
    def process_memory(self, memory_id: str):
        """Background processing of memory"""
        try:
            # Get memory record
            memory_record = self.db_session.query(MemoryRecord).filter_by(id=memory_id).first()
            if not memory_record:
                return
            
            # Update status
            memory_record.processing_status = "processing"
            self.db_session.commit()
            
            # Get image from MinIO
            image_data = self.minio_client.get_object(
                self.config.minio_bucket,
                memory_record.image_path
            ).read()
            
            # Generate AI description using EYE AI
            ai_description = self._generate_ai_description(image_data)
            
            # Generate embedding
            embedding = self._generate_embedding(ai_description)
            
            # Add to FAISS index
            faiss_id = int(self.faiss_index.ntotal)
            self.faiss_index.add(np.array([embedding]))
            
            # Update database record
            memory_record.ai_description = ai_description
            memory_record.embedding_model = self.config.embedding_model
            memory_record.embedding_dimension = self.config.embedding_dimension
            memory_record.faiss_index_id = faiss_id
            memory_record.processing_status = "completed"
            memory_record.processed_at = datetime.utcnow()
            
            self.db_session.commit()
            
            # Save FAISS index
            faiss.write_index(self.faiss_index, self.config.faiss_index_path)
            
        except Exception as e:
            print(f"Failed to process memory {memory_id}: {e}")
            # Update status to failed
            memory_record = self.db_session.query(MemoryRecord).filter_by(id=memory_id).first()
            if memory_record:
                memory_record.processing_status = "failed"
                memory_record.processing_error = str(e)
                self.db_session.commit()
    
    def _generate_ai_description(self, image_data: bytes) -> str:
        """Generate AI description of the image"""
        try:
            # For now, return a simple description based on image size
            # In production, you'd use proper vision AI
            image_size = len(image_data)
            if image_size > 1000000:  # > 1MB
                return "Large image with detailed content"
            elif image_size > 500000:  # > 500KB
                return "Medium-sized image with good quality"
            else:
                return "Small image with basic content"
                
        except Exception as e:
            print(f"Failed to generate AI description: {e}")
            return "Error generating description"
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using embedding model"""
        try:
            # For now, return a simple hash-based embedding
            # In production, use proper sentence-transformers
            import hashlib
            hash_obj = hashlib.md5(text.encode())
            hash_bytes = hash_obj.digest()
            
            # Create a 384-dimensional embedding by repeating and scaling
            embedding = []
            for i in range(self.config.embedding_dimension):
                byte_idx = i % len(hash_bytes)
                embedding.append(float(hash_bytes[byte_idx]) / 255.0)
            
            return embedding
            
        except Exception as e:
            print(f"Failed to generate embedding: {e}")
            # Return zero embedding as fallback
            return [0.0] * self.config.embedding_dimension
    
    async def search_memories(self, request: MemorySearchRequest) -> List[MemoryResponse]:
        """Search memories using text query"""
        try:
            # Generate embedding for query
            query_embedding = await self._generate_embedding(request.query)
            
            # Search FAISS index
            scores, indices = self.faiss_index.search(
                np.array([query_embedding]), 
                request.limit * 2  # Get more results for filtering
            )
            
            # Get memory records
            memory_responses = []
            for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
                if idx == -1:  # No more results
                    break
                
                # Get memory record by FAISS index ID
                memory_record = self.db_session.query(MemoryRecord).filter_by(
                    faiss_index_id=idx,
                    user_id=request.user_id
                ).first()
                
                if not memory_record:
                    continue
                
                # Apply filters
                if request.include_private is False and memory_record.is_private:
                    continue
                
                if request.filter_tags and not any(tag in (memory_record.user_tags or []) for tag in request.filter_tags):
                    continue
                
                if request.date_range:
                    if memory_record.created_at < request.date_range[0] or memory_record.created_at > request.date_range[1]:
                        continue
                
                # Generate image URL
                image_url = f"/api/v1/memory/image/{memory_record.image_uuid}"
                
                memory_response = MemoryResponse(
                    id=memory_record.id,
                    image_uuid=memory_record.image_uuid,
                    image_url=image_url,
                    ai_description=memory_record.ai_description,
                    detected_objects=memory_record.detected_objects,
                    scene_context=memory_record.scene_context,
                    emotional_context=memory_record.emotional_context,
                    user_tags=memory_record.user_tags,
                    user_notes=memory_record.user_notes,
                    created_at=memory_record.created_at,
                    similarity_score=float(score)
                )
                
                memory_responses.append(memory_response)
                
                if len(memory_responses) >= request.limit:
                    break
            
            return memory_responses
            
        except Exception as e:
            print(f"Failed to search memories: {e}")
            return []
    
    async def get_memory_by_id(self, memory_id: str, user_id: str) -> Optional[MemoryResponse]:
        """Get specific memory by ID"""
        try:
            memory_record = self.db_session.query(MemoryRecord).filter_by(
                id=memory_id,
                user_id=user_id
            ).first()
            
            if not memory_record:
                return None
            
            image_url = f"/api/v1/memory/image/{memory_record.image_uuid}"
            
            return MemoryResponse(
                id=memory_record.id,
                image_uuid=memory_record.image_uuid,
                image_url=image_url,
                ai_description=memory_record.ai_description,
                detected_objects=memory_record.detected_objects,
                scene_context=memory_record.scene_context,
                emotional_context=memory_record.emotional_context,
                user_tags=memory_record.user_tags,
                user_notes=memory_record.user_notes,
                created_at=memory_record.created_at
            )
            
        except Exception as e:
            print(f"Failed to get memory {memory_id}: {e}")
            return None
    
    async def get_user_memories(self, user_id: str, limit: int = 50, offset: int = 0) -> List[MemoryResponse]:
        """Get all memories for a user"""
        try:
            memory_records = self.db_session.query(MemoryRecord).filter_by(
                user_id=user_id
            ).order_by(MemoryRecord.created_at.desc()).offset(offset).limit(limit).all()
            
            memory_responses = []
            for memory_record in memory_records:
                image_url = f"/api/v1/memory/image/{memory_record.image_uuid}"
                
                memory_response = MemoryResponse(
                    id=memory_record.id,
                    image_uuid=memory_record.image_uuid,
                    image_url=image_url,
                    ai_description=memory_record.ai_description,
                    detected_objects=memory_record.detected_objects,
                    scene_context=memory_record.scene_context,
                    emotional_context=memory_record.emotional_context,
                    user_tags=memory_record.user_tags,
                    user_notes=memory_record.user_notes,
                    created_at=memory_record.created_at
                )
                
                memory_responses.append(memory_response)
            
            return memory_responses
            
        except Exception as e:
            print(f"Failed to get user memories: {e}")
            return []
    
    async def delete_memory(self, memory_id: str, user_id: str) -> bool:
        """Delete a memory"""
        try:
            memory_record = self.db_session.query(MemoryRecord).filter_by(
                id=memory_id,
                user_id=user_id
            ).first()
            
            if not memory_record:
                return False
            
            # Remove from MinIO
            try:
                self.minio_client.remove_object(self.config.minio_bucket, memory_record.image_path)
            except S3Error:
                pass  # Object might not exist
            
            # Remove from FAISS (this is complex, would need index rebuilding)
            # For now, just mark as deleted in database
            
            # Delete from database
            self.db_session.delete(memory_record)
            self.db_session.commit()
            
            return True
            
        except Exception as e:
            print(f"Failed to delete memory {memory_id}: {e}")
            return False
    
    async def close(self):
        """Cleanup resources"""
        if self.embedding_client:
            await self.embedding_client.aclose()
        if self.db_session:
            self.db_session.close()

# Global memory service instance
_memory_service: Optional[MemoryService] = None

def get_memory_service() -> MemoryService:
    """Get global memory service instance"""
    global _memory_service
    if _memory_service is None:
        config = MemoryConfig()
        _memory_service = MemoryService(config)
    return _memory_service

async def cleanup_memory_service():
    """Cleanup global memory service"""
    global _memory_service
    if _memory_service:
        await _memory_service.close()
        _memory_service = None
