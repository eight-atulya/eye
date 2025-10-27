# EYE API Reference

## 🌐 Base URLs

- **Development**: `http://localhost:8001`
- **Production**: `https://your-domain.com/api`

## 🔐 Authentication

EYE uses API key authentication for production deployments:

```bash
# Include API key in headers
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     http://localhost:8001/api/v1/projects
```

## 📋 API Endpoints

### 🏥 Health & Status

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-26T10:30:00Z"
}
```

#### Service Status
```http
GET /api/v1/status
```

**Response:**
```json
{
  "services": {
    "database": "healthy",
    "minio": "healthy",
    "ollama": "healthy",
    "redis": "healthy"
  },
  "gpu": {
    "available": true,
    "device": "NVIDIA GeForce RTX 4060 Ti",
    "memory": "16.0 GiB"
  }
}
```

### 📁 Projects

#### List Projects
```http
GET /api/v1/projects
```

**Query Parameters:**
- `limit` (int): Number of projects to return (default: 50)
- `offset` (int): Number of projects to skip (default: 0)
- `status` (string): Filter by status (`active`, `archived`, `completed`)

**Response:**
```json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "Object Detection Project",
      "description": "Detect objects in images",
      "status": "active",
      "created_at": "2025-01-26T10:30:00Z",
      "updated_at": "2025-01-26T10:30:00Z",
      "metadata": {
        "labels": ["person", "car", "bicycle"],
        "dataset_size": 1000
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### Create Project
```http
POST /api/v1/projects
```

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "labels": ["label1", "label2"],
  "metadata": {
    "custom_field": "value"
  }
}
```

**Response:**
```json
{
  "id": "proj_456",
  "name": "New Project",
  "description": "Project description",
  "status": "active",
  "created_at": "2025-01-26T10:30:00Z",
  "updated_at": "2025-01-26T10:30:00Z",
  "metadata": {
    "labels": ["label1", "label2"],
    "custom_field": "value"
  }
}
```

#### Get Project
```http
GET /api/v1/projects/{project_id}
```

**Response:**
```json
{
  "id": "proj_123",
  "name": "Object Detection Project",
  "description": "Detect objects in images",
  "status": "active",
  "created_at": "2025-01-26T10:30:00Z",
  "updated_at": "2025-01-26T10:30:00Z",
  "metadata": {
    "labels": ["person", "car", "bicycle"],
    "dataset_size": 1000
  },
  "statistics": {
    "total_images": 1000,
    "annotated_images": 750,
    "total_annotations": 2500
  }
}
```

#### Update Project
```http
PUT /api/v1/projects/{project_id}
```

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "active"
}
```

#### Delete Project
```http
DELETE /api/v1/projects/{project_id}
```

**Response:**
```json
{
  "message": "Project deleted successfully"
}
```

### 🏷️ Annotations

#### List Annotation Projects
```http
GET /api/v1/annotations/projects
```

**Response:**
```json
{
  "projects": [
    {
      "id": "ann_proj_123",
      "name": "Annotation Project",
      "description": "Project for annotation tasks",
      "labels": ["person", "car"],
      "status": "active",
      "created_at": "2025-01-26T10:30:00Z"
    }
  ]
}
```

#### Create Annotation Project
```http
POST /api/v1/annotations/projects
```

**Request Body:**
```json
{
  "name": "New Annotation Project",
  "description": "Project description",
  "labels": ["person", "car", "bicycle"]
}
```

#### Create Annotation Task
```http
POST /api/v1/annotations/tasks
```

**Request Body:**
```json
{
  "project_id": "ann_proj_123",
  "name": "Task 1",
  "description": "Annotate images",
  "data_s3_keys": ["image1.jpg", "image2.jpg"],
  "assigned_to": "user@example.com",
  "priority": "high",
  "due_date": "2025-02-01T00:00:00Z"
}
```

#### List Annotations
```http
GET /api/v1/annotations/tasks/{task_id}/annotations
```

**Response:**
```json
{
  "annotations": [
    {
      "id": "ann_123",
      "task_id": "task_123",
      "image_filename": "image1.jpg",
      "label_id": "person",
      "type": "bbox",
      "coordinates": [
        {
          "x": 100,
          "y": 100,
          "width": 200,
          "height": 300
        }
      ],
      "confidence": 0.95,
      "attributes": {
        "occluded": false,
        "truncated": false
      }
    }
  ]
}
```

#### Create Annotation
```http
POST /api/v1/annotations/tasks/{task_id}/annotations
```

**Request Body:**
```json
{
  "image_filename": "image1.jpg",
  "label_id": "person",
  "type": "bbox",
  "coordinates": [
    {
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 300
    }
  ],
  "confidence": 0.95,
  "attributes": {
    "occluded": false,
    "truncated": false
  }
}
```

#### Export Annotations
```http
POST /api/v1/annotations/tasks/{task_id}/export
```

**Request Body:**
```json
{
  "format": "coco",
  "include_images": false,
  "filter_labels": ["person", "car"],
  "quality_threshold": 0.8,
  "include_reviewed_only": true
}
```

**Response:**
```json
{
  "status": "success",
  "format": "coco",
  "export_path": "/exports/task_123_coco.json",
  "message": "Export started"
}
```

### 🤖 EYE AI

#### Health Check
```http
GET /api/v1/ollama/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "ollama",
  "gpu_enabled": true,
  "model_loaded": "gemma3:12b"
}
```

#### List Models
```http
GET /api/v1/ollama/models
```

**Response:**
```json
{
  "models": [
    {
      "name": "gemma3:12b",
      "model": "gemma3:12b",
      "modified_at": "2025-01-26T10:30:00Z",
      "size": 8149190253,
      "digest": "f4031aab637d1ffa37b42570452ae0e4fad0314754d17ded67322e4b95836f8a"
    }
  ],
  "count": 1
}
```

#### Chat with EYE AI
```http
POST /api/v1/ollama/chat
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello! How are you?"
    }
  ],
  "model": "gemma3:12b",
  "temperature": 0.7,
  "stream": false
}
```

**Response:**
```json
{
  "model": "gemma3:12b",
  "created_at": "2025-01-26T10:30:00Z",
  "message": {
    "role": "assistant",
    "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
  },
  "done": true,
  "total_duration": 1234567890,
  "load_duration": 987654321,
  "prompt_eval_count": 10,
  "prompt_eval_duration": 123456789,
  "eval_count": 15,
  "eval_duration": 987654321
}
```

#### Generate Text
```http
POST /api/v1/ollama/generate
```

**Request Body:**
```json
{
  "prompt": "Write a haiku about AI and machines.",
  "model": "gemma3:12b",
  "temperature": 0.7,
  "max_tokens": 100
}
```

**Response:**
```json
{
  "model": "gemma3:12b",
  "created_at": "2025-01-26T10:30:00Z",
  "generated_text": "Metal minds learn fast,\nCode flows like digital streams,\nFuture takes new form.",
  "done": true,
  "total_duration": 1234567890,
  "load_duration": 987654321,
  "prompt_eval_count": 8,
  "prompt_eval_duration": 123456789,
  "eval_count": 12,
  "eval_duration": 987654321
}
```

#### Vision Analysis
```http
POST /api/v1/ollama/vision/chat
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What do you see in this image?"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
          }
        }
      ]
    }
  ],
  "model": "gemma3:12b",
  "temperature": 0.7
}
```

**Response:**
```json
{
  "model": "gemma3:12b",
  "created_at": "2025-01-26T10:30:00Z",
  "message": {
    "role": "assistant",
    "content": "I can see a scientist working in a laboratory setting. The image shows a person wearing a white lab coat, safety glasses, and gloves, standing at a laboratory bench with various scientific equipment including beakers, test tubes, and a microscope. The environment appears to be a modern research laboratory with clean, well-organized workspaces."
  },
  "done": true,
  "total_duration": 2345678901,
  "load_duration": 1234567890,
  "prompt_eval_count": 15,
  "prompt_eval_duration": 234567890,
  "eval_count": 25,
  "eval_duration": 1234567890
}
```

#### Upload Image for Vision
```http
POST /api/v1/ollama/vision/upload
```

**Request Body (multipart/form-data):**
- `file`: Image file (JPEG, PNG, GIF, WebP)
- `question`: Optional question about the image

**Response:**
```json
{
  "model": "gemma3:12b",
  "created_at": "2025-01-26T10:30:00Z",
  "message": {
    "role": "assistant",
    "content": "I can see a beautiful landscape with mountains in the background and a lake in the foreground. The image shows a serene natural setting with clear blue skies and green vegetation."
  },
  "done": true,
  "total_duration": 2345678901,
  "load_duration": 1234567890,
  "prompt_eval_count": 12,
  "prompt_eval_duration": 234567890,
  "eval_count": 20,
  "eval_duration": 1234567890
}
```

#### Pull Model
```http
POST /api/v1/ollama/pull
```

**Request Body:**
```json
{
  "model": "llama3.2:3b"
}
```

**Response:**
```json
{
  "status": "success",
  "model": "llama3.2:3b",
  "message": "Model pull started"
}
```

### 🚀 Training

#### List Training Jobs
```http
GET /api/v1/training/jobs
```

**Response:**
```json
{
  "jobs": [
    {
      "id": "job_123",
      "name": "YOLOv8 Training",
      "status": "running",
      "model_type": "yolov8",
      "dataset_id": "dataset_123",
      "created_at": "2025-01-26T10:30:00Z",
      "started_at": "2025-01-26T10:35:00Z",
      "progress": 0.65,
      "metrics": {
        "loss": 0.123,
        "accuracy": 0.95,
        "epoch": 13,
        "total_epochs": 20
      }
    }
  ],
  "total": 1
}
```

#### Create Training Job
```http
POST /api/v1/training/jobs
```

**Request Body:**
```json
{
  "name": "New Training Job",
  "model_type": "yolov8",
  "dataset_id": "dataset_123",
  "config": {
    "epochs": 100,
    "batch_size": 16,
    "learning_rate": 0.001,
    "image_size": 640
  },
  "gpu_required": true
}
```

**Response:**
```json
{
  "id": "job_456",
  "name": "New Training Job",
  "status": "queued",
  "model_type": "yolov8",
  "dataset_id": "dataset_123",
  "created_at": "2025-01-26T10:30:00Z",
  "config": {
    "epochs": 100,
    "batch_size": 16,
    "learning_rate": 0.001,
    "image_size": 640
  }
}
```

#### Get Training Job
```http
GET /api/v1/training/jobs/{job_id}
```

**Response:**
```json
{
  "id": "job_123",
  "name": "YOLOv8 Training",
  "status": "running",
  "model_type": "yolov8",
  "dataset_id": "dataset_123",
  "created_at": "2025-01-26T10:30:00Z",
  "started_at": "2025-01-26T10:35:00Z",
  "progress": 0.65,
  "metrics": {
    "loss": 0.123,
    "accuracy": 0.95,
    "epoch": 13,
    "total_epochs": 20
  },
  "logs": [
    "Epoch 13/20: loss=0.123, accuracy=0.95",
    "Validation: loss=0.145, accuracy=0.92"
  ],
  "artifacts": {
    "model_path": "/models/job_123/best.pt",
    "checkpoint_path": "/models/job_123/last.pt",
    "results_path": "/results/job_123/results.csv"
  }
}
```

#### Cancel Training Job
```http
POST /api/v1/training/jobs/{job_id}/cancel
```

**Response:**
```json
{
  "status": "success",
  "message": "Training job cancelled"
}
```

### 📁 File Management

#### Upload Image
```http
POST /api/v1/uploads/image
```

**Request Body (multipart/form-data):**
- `file`: Image file (JPEG, PNG, GIF, WebP, TIFF)

**Response:**
```json
{
  "id": "upload_123",
  "filename": "image.jpg",
  "content_type": "image/jpeg",
  "size": 1024000,
  "s3_uri": "s3://eye-training-data/uploads/image_123.jpg",
  "object_key": "uploads/image_123.jpg",
  "url": "http://localhost:9003/eye-training-data/uploads/image_123.jpg",
  "created_at": "2025-01-26T10:30:00Z"
}
```

#### List Uploads
```http
GET /api/v1/uploads
```

**Query Parameters:**
- `limit` (int): Number of uploads to return (default: 50)
- `offset` (int): Number of uploads to skip (default: 0)
- `content_type` (string): Filter by content type

**Response:**
```json
{
  "uploads": [
    {
      "id": "upload_123",
      "filename": "image.jpg",
      "content_type": "image/jpeg",
      "size": 1024000,
      "s3_uri": "s3://eye-training-data/uploads/image_123.jpg",
      "created_at": "2025-01-26T10:30:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### Delete Upload
```http
DELETE /api/v1/uploads/{upload_id}
```

**Response:**
```json
{
  "status": "success",
  "message": "Upload deleted successfully"
}
```

## 🔄 WebSocket Endpoints

### Training Progress
```javascript
// Connect to training progress updates
const ws = new WebSocket('ws://localhost:8001/ws/training/{job_id}');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Training progress:', data);
};

// Example message:
{
  "type": "progress",
  "job_id": "job_123",
  "progress": 0.65,
  "metrics": {
    "loss": 0.123,
    "accuracy": 0.95,
    "epoch": 13
  }
}
```

### Ollama Streaming
```javascript
// Connect to Ollama streaming responses
const ws = new WebSocket('ws://localhost:8001/ws/ollama/chat');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Streaming response:', data);
};

// Example message:
{
  "type": "chunk",
  "content": "Hello! How can I help you today?",
  "done": false
}
```

## 📊 Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "name",
      "issue": "Name is required"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## 🔧 Rate Limiting

API requests are rate limited to prevent abuse:

- **General API**: 1000 requests per hour per IP
- **Ollama AI**: 100 requests per hour per IP
- **File Uploads**: 50 requests per hour per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 📝 Examples

### Complete Workflow Example

```bash
# 1. Create a project
curl -X POST http://localhost:8001/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project", "description": "Test project"}'

# 2. Upload an image
curl -X POST http://localhost:8001/api/v1/uploads/image \
  -F "file=@image.jpg"

# 3. Create annotation project
curl -X POST http://localhost:8001/api/v1/annotations/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Annotation Project", "labels": ["person", "car"]}'

# 4. Chat with Ollama AI
curl -X POST http://localhost:8001/api/v1/ollama/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'

# 5. Analyze image with Ollama
curl -X POST http://localhost:8001/api/v1/ollama/vision/upload \
  -F "file=@image.jpg" \
  -F "question=What do you see?"
```

### Python SDK Example

```python
import requests

# Initialize client
base_url = "http://localhost:8001"
headers = {"Content-Type": "application/json"}

# Create project
project_data = {
    "name": "My Project",
    "description": "Test project"
}
response = requests.post(f"{base_url}/api/v1/projects", 
                        json=project_data, headers=headers)
project = response.json()

# Upload image
with open("image.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post(f"{base_url}/api/v1/uploads/image", files=files)
    upload = response.json()

# Chat with AI
chat_data = {
    "messages": [{"role": "user", "content": "Hello!"}]
}
response = requests.post(f"{base_url}/api/v1/ollama/chat", 
                        json=chat_data, headers=headers)
chat_response = response.json()
print(chat_response["message"]["content"])
```

---

**API Version**: 1.0.0  
**Last Updated**: January 26, 2025  
**Base URL**: http://localhost:8001 (development)
