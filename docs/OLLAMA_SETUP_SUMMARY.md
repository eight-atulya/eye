# Ollama Integration - Quick Setup Summary

## What Was Added

Ollama with GPU support has been integrated into the EYE system with Gemma3:12b as the default model for LLM and vision processing.

## New Files Created

1. **`backend/services/ollama_service.py`** - Core Ollama service with GPU support
2. **`backend/api/ollama.py`** - API endpoints for LLM and vision processing
3. **`scripts/setup_ollama.py`** - Automated model setup script
4. **`docs/OLLAMA_INTEGRATION.md`** - Comprehensive documentation

## Modified Files

1. **`backend/main.py`** - Added Ollama router
2. **`docker-compose.yml`** - Added Ollama service with GPU support
3. **`config/eye.yaml`** - Added Ollama configuration
4. **`backend/requirements.txt`** - Added requests dependency

## Quick Start

### 1. Start Ollama Service

```bash
docker-compose up -d ollama
```

### 2. Pull Default Model

```bash
python scripts/setup_ollama.py
```

Or manually:
```bash
docker exec ollama ollama pull gemma3:12b
```

### 3. Verify Setup

```bash
# Check health
curl http://localhost:8001/api/v1/ollama/health

# List models
curl http://localhost:8001/api/v1/ollama/models
```

## API Endpoints

- `GET /api/v1/ollama/health` - Service health
- `GET /api/v1/ollama/models` - List available models
- `POST /api/v1/ollama/chat` - LLM chat/conversation
- `POST /api/v1/ollama/generate` - Text generation
- `POST /api/v1/ollama/vision/chat` - Vision analysis with images
- `POST /api/v1/ollama/vision/upload` - Upload and analyze images
- `POST /api/v1/ollama/pull` - Pull models on-demand

## Example Usage

### Chat with LLM

```bash
curl -X POST http://localhost:8001/api/v1/ollama/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Explain quantum computing"}]
  }'
```

### Analyze Image

```bash
curl -X POST http://localhost:8001/api/v1/ollama/vision/upload \
  -F "file=@image.jpg" \
  -F "question=What objects are in this image?"
```

## Configuration

Ollama is configured in `config/eye.yaml`:

```yaml
services:
  ollama:
    host: "ollama"
    port: 11434
    default_model: "gemma3:12b"
    enable_gpu: true
```

## GPU Requirements

- NVIDIA GPU with CUDA support
- Docker with GPU access
- At least 8GB GPU memory for Gemma3:12b

## Documentation

For detailed documentation, see:
- [Complete Integration Guide](OLLAMA_INTEGRATION.md)
- [API Documentation](https://ollama.com/docs)

## Troubleshooting

### GPU Not Working

```bash
# Check NVIDIA drivers
nvidia-smi

# Check Docker GPU
docker exec ollama nvidia-smi
```

### Service Not Responding

```bash
# Check logs
docker-compose logs ollama

# Restart service
docker-compose restart ollama
```

---

**EYE for Humanity** - AI-powered research management
