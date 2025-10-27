"""
Ollama API Router - LLM and Vision Model Endpoints
Provides industrial-grade API endpoints for chat, text generation, and vision processing
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Body
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import base64
from services.ollama_service import get_ollama_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/ollama", tags=["ollama"])


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Chat request model"""
    messages: List[ChatMessage] = Field(..., description="List of messages")
    model: Optional[str] = Field(None, description="Model to use (defaults to gemma3:12b)")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    stream: bool = Field(False, description="Whether to stream the response")


class GenerateRequest(BaseModel):
    """Text generation request model"""
    prompt: str = Field(..., description="Input prompt")
    model: Optional[str] = Field(None, description="Model to use (defaults to gemma3:12b)")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: int = Field(2048, gt=0, description="Maximum tokens to generate")


class VisionChatMessage(BaseModel):
    """Vision chat message model"""
    role: str = Field(..., description="Message role")
    content: str = Field(..., description="Message content")
    images: Optional[List[str]] = Field(None, description="Base64 encoded images")


class VisionChatRequest(BaseModel):
    """Vision chat request model"""
    messages: List[VisionChatMessage] = Field(..., description="List of messages with images")
    model: Optional[str] = Field(None, description="Model to use (defaults to gemma3:12b)")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")


@router.get("/health")
async def ollama_health():
    """Check Ollama service health"""
    try:
        service = get_ollama_service()
        is_healthy = await service.health_check()
        
        if is_healthy:
            return {
                "status": "healthy",
                "service": "ollama",
                "gpu_enabled": True
            }
        else:
            raise HTTPException(status_code=503, detail="Ollama service is not available")
            
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")


@router.get("/models")
async def list_models():
    """List all available models"""
    try:
        service = get_ollama_service()
        await service.initialize()
        models = await service.list_models()
        
        return {
            "models": models,
            "count": len(models)
        }
        
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Send a chat request to the LLM
    
    This endpoint allows you to have a conversational interaction with the LLM.
    Supports streaming and non-streaming responses.
    """
    try:
        service = get_ollama_service()
        await service.initialize()
        
        # Convert Pydantic models to dict
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        if request.stream:
            # For streaming, we return a streaming response
            from fastapi.responses import StreamingResponse
            import json
            
            async def generate():
                try:
                    async for chunk in service.chat(
                        messages=messages,
                        model=request.model,
                        temperature=request.temperature,
                        stream=True
                    ):
                        yield f"data: {json.dumps(chunk)}\n\n"
                except Exception as e:
                    error_chunk = {"error": str(e)}
                    yield f"data: {json.dumps(error_chunk)}\n\n"
            
            return StreamingResponse(generate(), media_type="text/event-stream")
        else:
            # Non-streaming response
            response = await service.chat(
                messages=messages,
                model=request.model,
                temperature=request.temperature,
                stream=False
            )
            
            return response
            
    except Exception as e:
        logger.error(f"Chat request failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat request failed: {str(e)}")


@router.post("/generate")
async def generate(request: GenerateRequest):
    """
    Generate text from a prompt
    
    This endpoint generates text based on a single prompt without conversation history.
    """
    try:
        service = get_ollama_service()
        await service.initialize()
        
        response = await service.generate(
            prompt=request.prompt,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        return {
            "generated_text": response,
            "model": request.model or "gemma3:12b"
        }
        
    except Exception as e:
        logger.error(f"Generate request failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generate request failed: {str(e)}")


@router.post("/vision/chat")
async def vision_chat(request: VisionChatRequest):
    """
    Send a vision request to the multimodal model
    
    This endpoint processes images with the LLM and returns natural language descriptions,
    analysis, or answers to questions about the images.
    """
    try:
        service = get_ollama_service()
        await service.initialize()
        
        # Convert Pydantic models to dict
        messages = []
        for msg in request.messages:
            message_dict = {
                "role": msg.role,
                "content": msg.content
            }
            if msg.images:
                message_dict["images"] = msg.images
            messages.append(message_dict)
        
        response = await service.vision_chat(
            messages=messages,
            model=request.model,
            temperature=request.temperature
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Vision chat request failed: {e}")
        raise HTTPException(status_code=500, detail=f"Vision chat request failed: {str(e)}")


@router.post("/vision/upload")
async def vision_upload(
    file: UploadFile = File(...),
    question: str = Body(None, description="Question about the image")
):
    """
    Upload an image and ask a question about it
    
    This is a convenience endpoint that combines image upload and vision processing.
    """
    try:
        # Read and encode the image
        image_data = await file.read()
        
        # Get the content type
        content_type = file.content_type or "image/jpeg"
        
        # Create base64 string for Ollama (without data URL prefix)
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Prepare the message
        content = question or "What do you see in this image? Please describe it in detail."
        messages = [
            {
                "role": "user",
                "content": content,
                "images": [image_base64]
            }
        ]
        
        # Process with vision model
        service = get_ollama_service()
        await service.initialize()
        
        response = await service.vision_chat(
            messages=messages,
            temperature=0.7
        )
        
        return {
            "question": question,
            "response": response.get("message", {}).get("content", ""),
            "filename": file.filename
        }
        
    except Exception as e:
        logger.error(f"Vision upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Vision upload failed: {str(e)}")


@router.post("/pull")
async def pull_model(model: str = Body(..., description="Model name to pull")):
    """
    Pull a model from Ollama registry
    
    This endpoint allows you to download models on demand.
    """
    try:
        service = get_ollama_service()
        await service.initialize()
        
        success = await service.ensure_model_pulled(model)
        
        if success:
            return {
                "status": "success",
                "model": model,
                "message": f"Model {model} pulled successfully"
            }
        else:
            raise HTTPException(status_code=500, detail=f"Failed to pull model {model}")
            
    except Exception as e:
        logger.error(f"Failed to pull model: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to pull model: {str(e)}")
