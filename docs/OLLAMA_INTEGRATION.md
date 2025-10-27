# Ollama Integration with GPU Support

## Overview

EYE now includes GPU-accelerated Ollama integration for running Large Language Models (LLMs) and Vision Models. The system uses [Gemma3:12b](https://ollama.com/library/gemma3:12b) as the default multimodal model for both text and image processing.

## Features

- **GPU Acceleration**: Full GPU support for fast inference
- **Multimodal AI**: Text and vision processing with Gemma3:12b
- **Multiple Endpoints**: Chat, text generation, and vision analysis
- **Streaming Support**: Real-time streaming responses
- **Model Management**: Pull and manage models on-demand

## Architecture

### Services

1. **Ollama Service** (`backend/services/ollama_service.py`): Core service for interacting with Ollama
2. **API Router** (`backend/api/ollama.py`): RESTful API endpoints
3. **Docker Container**: GPU-enabled Ollama container
4. **Setup Script** (`scripts/setup_ollama.py`): Automated model setup

### Configuration

Ollama is configured in `config/eye.yaml`:

```yaml
services:
  ollama:
    host: "ollama"
    port: 11434
    default_model: "gemma3:12b"
    enable_gpu: true
```

### Docker Compose

The Ollama service is configured with GPU support:

```yaml
ollama:
  image: ollama/ollama:latest
  ports:
    - 11434:11434
  volumes:
    - ollama_data:/root/.ollama
  gpus: all
  environment:
    - NVIDIA_VISIBLE_DEVICES=all
    - NVIDIA_DRIVER_CAPABILITIES=compute,utility
```

## API Endpoints

### Health Check

```http
GET /api/v1/ollama/health
```

Returns service health status and GPU configuration.

### List Models

```http
GET /api/v1/ollama/models
```

Returns all available models.

### Chat (LLM Conversation)

```http
POST /api/v1/ollama/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Explain quantum computing"}
  ],
  "model": "gemma3:12b",
  "temperature": 0.7,
  "stream": false
}
```

**Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Quantum computing is..."
  },
  "done": true
}
```

### Text Generation

```http
POST /api/v1/ollama/generate
Content-Type: application/json

{
  "prompt": "Write a poem about AI",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**Response:**
```json
{
  "generated_text": "In the realm of ones and zeros...",
  "model": "gemma3:12b"
}
```

### Vision Chat (Image Analysis)

```http
POST /api/v1/ollama/vision/chat
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "What's in this image?",
      "images": ["base64_encoded_image_data"]
    }
  ],
  "temperature": 0.7
}
```

### Vision Upload (Convenience Endpoint)

```http
POST /api/v1/ollama/vision/upload
Content-Type: multipart/form-data

file: <image file>
question: "What objects are visible in this image?"
```

### Pull Model

```http
POST /api/v1/ollama/pull
Content-Type: application/json

{
  "model": "gemma3:4b"
}
```

## Usage Examples

### Python Client Example

```python
import httpx
import base64

# Initialize client
client = httpx.AsyncClient(base_url="http://localhost:8001")

# Chat example
async def chat():
    response = await client.post(
        "/api/v1/ollama/chat",
        json={
            "messages": [
                {"role": "user", "content": "What is machine learning?"}
            ],
            "temperature": 0.7
        }
    )
    return response.json()

# Vision example
async def analyze_image(image_path):
    # Read and encode image
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    response = await client.post(
        "/api/v1/ollama/vision/chat",
        json={
            "messages": [
                {
                    "role": "user",
                    "content": "Describe this image in detail",
                    "images": [image_data]
                }
            ]
        }
    )
    return response.json()
```

### cURL Examples

**Health Check:**
```bash
curl http://localhost:8001/api/v1/ollama/health
```

**Chat:**
```bash
curl -X POST http://localhost:8001/api/v1/ollama/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Vision Analysis:**
```bash
curl -X POST http://localhost:8001/api/v1/ollama/vision/upload \
  -F "file=@image.jpg" \
  -F "question=What do you see?"
```

## Setup and Deployment

### Initial Setup

1. **Start the services:**
```bash
docker-compose up -d ollama
```

2. **Pull the default model:**
```bash
python scripts/setup_ollama.py
```

Or manually:
```bash
docker exec ollama ollama pull gemma3:12b
```

### Verify GPU Support

```bash
docker exec ollama nvidia-smi
```

You should see the Ollama process using GPU memory.

### Check Service Health

```bash
curl http://localhost:8001/api/v1/ollama/health
```

## Model Information

### Gemma3:12b

- **Parameters**: 12.2 billion
- **Context Window**: 128K tokens
- **Multimodal**: Yes (text + vision)
- **Languages**: 140+ languages supported
- **Size**: ~8.1GB (Q4_K_M quantization)
- **License**: Gemma Terms of Use

### Other Available Models

You can pull other models:
- `gemma3:270m` - Smallest text-only model
- `gemma3:1b` - Small text-only model
- `gemma3:4b` - Mid-size multimodal model
- `gemma3:27b` - Largest multimodal model

## Integration with EYE System

### YOLO-E Integration

The Ollama vision model can work alongside YOLO-E for enhanced object detection:

```python
# Traditional object detection
yolo_results = yolo_detector.detect(image)

# Enhanced description with Ollama
vision_result = await ollama_service.vision_chat(
    messages=[{
        "role": "user",
        "content": f"Describe this scene with objects: {yolo_results}",
        "images": [image_base64]
    }]
)
```

### Research Workflow

1. **Image Acquisition**: Upload images to EYE
2. **YOLO-E Detection**: Detect objects with YOLO-E
3. **Ollama Description**: Get natural language descriptions
4. **CVAT Annotation**: Create annotations based on AI suggestions
5. **Training**: Train custom models on annotated data

## Performance Considerations

### GPU Memory

- **Gemma3:12b**: Requires ~8GB GPU memory
- **Gemma3:4b**: Requires ~4GB GPU memory
- **Gemma3:1b**: Requires ~1GB GPU memory

### Inference Speed

- GPU acceleration provides ~10-50x speedup vs CPU
- First request may be slower (model loading)
- Subsequent requests are faster

### Optimization Tips

1. Use smaller models (4b or 1b) for faster inference
2. Enable quantization for lower memory usage
3. Batch multiple requests when possible
4. Use streaming for real-time responses

## Troubleshooting

### Ollama Service Not Available

```bash
# Check container status
docker-compose ps ollama

# Check logs
docker-compose logs ollama

# Restart service
docker-compose restart ollama
```

### GPU Not Detected

```bash
# Verify NVIDIA drivers
nvidia-smi

# Check Docker GPU support
docker run --rm --gpus all nvidia/cuda:11.0.3-base-ubuntu20.04 nvidia-smi
```

### Model Pull Failed

```bash
# Check disk space
df -h

# Retry with explicit pull
docker exec ollama ollama pull gemma3:12b
```

### Out of Memory Errors

Reduce model size or enable quantization:
```bash
docker exec ollama ollama pull gemma3:4b
```

## Security Considerations

- Ollama runs in an isolated container
- No external network access required for inference
- Model data is stored in Docker volumes
- API endpoints require authentication in production

## Future Enhancements

- [ ] Support for more models (Llama, Mistral, etc.)
- [ ] Fine-tuning capabilities
- [ ] Vector database integration for RAG
- [ ] Multi-GPU support for larger models
- [ ] Model quantization options
- [ ] Batch processing optimization

## References

- [Ollama Documentation](https://ollama.ai/docs)
- [Gemma3:12b Model Card](https://ollama.com/library/gemma3:12b)
- [Google Gemma Documentation](https://ai.google.dev/gemma)
- [GPU Setup Guide](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)

## Support

For issues or questions:
1. Check service logs: `docker-compose logs ollama`
2. Verify GPU support: `nvidia-smi`
3. Test API endpoints: `curl http://localhost:8001/api/v1/ollama/health`
4. Review this documentation

---

**EYE for Humanity** - *AI-powered research and lab management platform*
