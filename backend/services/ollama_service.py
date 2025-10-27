"""
Ollama Service - GPU-accelerated LLM and Vision Model Integration
Industrial-grade service for running Gemma3:12b and other models
"""

import httpx
import asyncio
from typing import Optional, Dict, List, Any, Union, AsyncGenerator
from pydantic import BaseModel, Field
import logging
from functools import lru_cache
import json

logger = logging.getLogger(__name__)


class OllamaConfig(BaseModel):
    """Ollama service configuration"""
    base_url: str = Field(default="http://ollama:11434")
    default_model: str = Field(default="gemma3:12b")
    timeout: int = Field(default=300)
    max_retries: int = Field(default=3)
    enable_gpu: bool = Field(default=True)


class ChatMessage(BaseModel):
    """Chat message format for Ollama"""
    role: str  # "user", "assistant", "system"
    content: str


class VisionMessage(BaseModel):
    """Vision message format for multimodal models"""
    role: str
    content: str
    images: Optional[List[str]] = None  # Base64 encoded images


class OllamaService:
    """
    Industrial-grade Ollama service for LLM and Vision AI integration
    Supports GPU acceleration and multimodal processing
    """
    
    def __init__(self, config: Optional[OllamaConfig] = None):
        self.config = config or OllamaConfig()
        self.client: Optional[httpx.AsyncClient] = None
        self._initialized = False
        
    async def initialize(self) -> bool:
        """Initialize the Ollama service and verify connection"""
        if self._initialized:
            return True
            
        try:
            self.client = httpx.AsyncClient(
                base_url=self.config.base_url,
                timeout=self.config.timeout
            )
            
            # Check if Ollama is running and available
            health_check = await self.health_check()
            if health_check:
                logger.info(f"Ollama service initialized successfully at {self.config.base_url}")
                self._initialized = True
                return True
            else:
                logger.error("Ollama service is not available")
                return False
                
        except Exception as e:
            logger.error(f"Failed to initialize Ollama service: {e}")
            return False
    
    async def close(self):
        """Close the HTTP client"""
        if self.client:
            await self.client.aclose()
            self.client = None
            self._initialized = False
    
    async def health_check(self) -> bool:
        """Check if Ollama service is healthy"""
        try:
            if not self.client:
                self.client = httpx.AsyncClient(
                    base_url=self.config.base_url,
                    timeout=5.0
                )
            
            response = await self.client.get("/api/tags")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List all available models"""
        if not self._initialized:
            await self.initialize()
        
        try:
            response = await self.client.get("/api/tags")
            if response.status_code == 200:
                data = response.json()
                return data.get("models", [])
            return []
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []
    
    async def ensure_model_pulled(self, model_name: Optional[str] = None) -> bool:
        """Ensure the model is pulled and ready to use"""
        model = model_name or self.config.default_model
        
        try:
            # Check if model exists
            models = await self.list_models()
            model_names = [m.get("name") for m in models]
            
            if model in model_names:
                logger.info(f"Model {model} is already available")
                return True
            
            # Pull the model
            logger.info(f"Pulling model {model}...")
            response = await self.client.post(
                "/api/pull",
                json={"name": model},
                timeout=600  # 10 minutes for large models
            )
            
            if response.status_code == 200:
                logger.info(f"Model {model} pulled successfully")
                return True
            else:
                logger.error(f"Failed to pull model {model}: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error ensuring model is pulled: {e}")
            return False
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        stream: bool = False
    ) -> Union[Dict[str, Any], AsyncGenerator]:
        """
        Send a chat request to the LLM
        
        Args:
            messages: List of messages with 'role' and 'content'
            model: Model to use (defaults to configured model)
            temperature: Sampling temperature
            stream: Whether to stream the response
        
        Returns:
            Response dictionary with 'message' and 'done' keys
        """
        if not self._initialized:
            await self.initialize()
        
        model = model or self.config.default_model
        
        # Ensure model is available
        await self.ensure_model_pulled(model)
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": temperature
            }
        }
        
        try:
            if stream:
                # For streaming, return async generator
                async def stream_generator():
                    async with self.client.stream(
                        "POST",
                        "/api/chat",
                        json=payload,
                        timeout=self.config.timeout
                    ) as response:
                        async for chunk in response.aiter_lines():
                            if chunk:
                                try:
                                    data = json.loads(chunk)
                                    yield data
                                except json.JSONDecodeError:
                                    pass
                                except Exception as e:
                                    logger.error(f"Error parsing stream chunk: {e}")
                
                return stream_generator()
            else:
                # Non-streaming response
                response = await self.client.post(
                    "/api/chat",
                    json=payload,
                    timeout=self.config.timeout
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Chat API error: {response.text}")
                    raise Exception(f"Chat API returned {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Chat request failed: {e}")
            raise
    
    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> str:
        """
        Generate text from a prompt
        
        Args:
            prompt: Input prompt
            model: Model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
        
        Returns:
            Generated text
        """
        if not self._initialized:
            await self.initialize()
        
        model = model or self.config.default_model
        
        # Ensure model is available
        await self.ensure_model_pulled(model)
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        try:
            response = await self.client.post(
                "/api/generate",
                json=payload,
                timeout=self.config.timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "")
            else:
                logger.error(f"Generate API error: {response.text}")
                raise Exception(f"Generate API returned {response.status_code}")
                
        except Exception as e:
            logger.error(f"Generate request failed: {e}")
            raise
    
    async def vision_chat(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Send a vision request to the multimodal model
        
        Args:
            messages: List of messages with 'role', 'content', and optionally 'images'
            model: Model to use (defaults to gemma3:12b)
            temperature: Sampling temperature
        
        Returns:
            Response dictionary with message content
        """
        if not self._initialized:
            await self.initialize()
        
        model = model or self.config.default_model
        
        # Ensure model is available
        await self.ensure_model_pulled(model)
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature
            }
        }
        
        try:
            response = await self.client.post(
                "/api/chat",
                json=payload,
                timeout=self.config.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Vision chat API error: {response.text}")
                raise Exception(f"Vision chat API returned {response.status_code}")
                
        except Exception as e:
            logger.error(f"Vision chat request failed: {e}")
            raise


# Global service instance
_ollama_service: Optional[OllamaService] = None


def get_ollama_service() -> OllamaService:
    """Get or create the global Ollama service instance"""
    global _ollama_service
    if _ollama_service is None:
        _ollama_service = OllamaService()
    return _ollama_service


async def cleanup_ollama_service():
    """Cleanup the Ollama service on shutdown"""
    global _ollama_service
    if _ollama_service:
        await _ollama_service.close()
        _ollama_service = None
