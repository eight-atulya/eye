# EYE 👁️ - AI-First Computer Vision & Memory Preservation Platform

[![License: COFFEE](https://img.shields.io/badge/License-COFFEE-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/anuragatulya/EYE?style=social)](https://github.com/anuragatulya/EYE)

**EYE is an open-source platform designed to preserve your photos and videos as intelligent memories, enabling insightful conversations with your personal history through AI.** It also serves as a comprehensive workspace for computer vision tasks, integrating annotation, training, and inference pipelines.

**Core Philosophy**: "Preserve memories. Have intelligent conversations." EYE aims to democratize AI, making powerful tools accessible for personal use, small businesses, and researchers, inspired by the idea that "small ideas can work".

---

## ✨ Key Features

* **🧠 Memory System**: Upload photos/videos to create a searchable, intelligent memory vault. Uses MinIO for storage, FAISS for similarity search, and AI for descriptions/context.
* **💬 EYE AI (Ollama Integration)**: Interact with your data and general knowledge using powerful multimodal AI models like Gemma3:12b.
    * **Chat**: Conversational AI interface.
    * **Vision**: Analyze images using drag-and-drop, ask questions about visual content.
    * **Generate**: (Coming Soon) Text generation capabilities.
    * **GPU Accelerated**: Leverages NVIDIA GPUs via Docker for fast inference.
* **🎯 YOLO-E Integration**: High-performance object detection and instance segmentation using state-of-the-art YOLO-E models.
    * **Open-Vocabulary**: Detect objects using text prompts, visual prompts, or a vast internal vocabulary (1200+ classes).
    * **Prompt-Free Mode**: Efficient detection using built-in classes.
    * **API**: Endpoints for model loading, single/batch inference, and training.
* **✍️ Annotation System**: Industrial-grade interface for creating image annotations (bounding boxes, polygons, points).
    * **Project & Task Management**: Organize annotation work efficiently.
    * **CVAT Integration**: Seamlessly connect with the Computer Vision Annotation Tool (CVAT) for professional workflows.
    * **AI Pre-labeling**: Speed up annotation using model predictions (e.g., from YOLO-E).
    * **Export Formats**: Supports COCO, YOLO, Pascal VOC, and more.
* **🚀 Training Pipeline**: (In Development) End-to-end pipeline for training custom computer vision models, including few-shot learning with YOLO-E.
* **🛠️ Modular Architecture**: Built with modern technologies (FastAPI, Next.js, Docker) for scalability and maintainability.
* **⚙️ Centralized Configuration**: Single `config/eye.yaml` file manages system settings, auto-generating Docker Compose and `.env` files.
* **📊 Monitoring**: Integrated Prometheus for monitoring service health and performance.

---

## 🏗️ Architecture

EYE utilizes a microservices architecture orchestrated with Docker Compose:

* **`frontend`**: Next.js (React) application providing the user interface (Port `3003`).
* **`backend`**: FastAPI (Python) application serving the main API (Port `8001`).
* **`db`**: PostgreSQL database for storing metadata (Port `5433`).
* **`redis`**: Redis instance for caching and job queuing (Port `6380`).
* **`minio`**: S3-compatible object storage for images, datasets, and models (API Port `9002`, Console Port `9003`).
* **`ollama`**: Runs LLMs and Vision Models (e.g., Gemma3:12b) with GPU acceleration (Port `11434`).
* **`worker`**: Python worker process for handling background tasks from the Redis queue.
* **`prometheus`**: Monitoring system (Port `9090`).
* **(Optional) `cvat`**: CVAT services for advanced annotation (Port `8080`).


---

## 🚀 Getting Started

### Prerequisites

* Docker & Docker Compose ([Install Docker](https://docs.docker.com/get-docker/))
* Git
* Python 3.10+ (for configuration script)
* (Optional but Recommended) NVIDIA GPU with drivers installed for AI features.

### Quick Install

1.  **Clone the Repository**:
    ```bash
    git clone [https://github.com/anuragatulya/EYE.git](https://github.com/anuragatulya/EYE.git)
    cd EYE
    ```

2.  **Generate Configuration**:
    *(This uses `config/eye.yaml` to create `docker-compose.yml` and necessary `.env` files)*
    ```bash
    python scripts/generate-config.py
    ```

3.  **Download AI Models (Ollama & YOLO-E)**:
    *(Run these scripts sequentially)*
    ```bash
    python scripts/setup_ollama.py # Pulls default Ollama model (e.g., gemma3:12b)
    python scripts/download_yolo_e_weights.py # Downloads YOLO-E models
    ```

4.  **Start Services**:
    ```bash
    docker-compose up -d --build
    ```
    *(Wait a few minutes for services to initialize, especially Ollama downloading models if `setup_ollama.py` wasn't run or failed)*

5.  **Access EYE**:
    * **Main Dashboard**: [http://localhost:3003](http://localhost:3003)
    * **EYE AI**: [http://localhost:3003/eye-ai](http://localhost:3003/eye-ai)
    * **Memory Vault**: [http://localhost:3003/memory](http://localhost:3003/memory)
    * **Inference**: [http://localhost:3003/inference](http://localhost:3003/inference)
    * **Annotation**: [http://localhost:3003/annotation](http://localhost:3003/annotation)
    * **Training**: [http://localhost:3003/training](http://localhost:3003/training)
    * **Backend API Docs (Swagger)**: [http://localhost:8001/docs](http://localhost:8001/docs)
    * **MinIO Console**: [http://localhost:9003](http://localhost:9003) (Login with keys from `config/eye.yaml`)

### Verification Checklist

* [ ] All containers running (`docker-compose ps`)
* [ ] Frontend accessible at `http://localhost:3003`
* [ ] Backend API responding at `http://localhost:8001/health`
* [ ] EYE AI working at `http://localhost:3003/eye-ai`
* [ ] GPU detected by Ollama (if available): `docker-compose logs ollama | grep GPU`

---

## 🔧 Configuration

EYE uses a centralized configuration system. **Modify `config/eye.yaml` ONLY** and then run `python scripts/generate-config.py` to update `docker-compose.yml` and environment files.

* **Ports**: Adjust service ports if they conflict with other applications on your system.
* **Models**: Change default AI models (Ollama, YOLO-E).
* **Resources**: Configure database credentials, MinIO keys, etc..
* **Features**: Enable/disable features like CVAT integration or GPU usage.

See the [Configuration Guide](docs/CONFIGURATION.md) for details.

---

## 🛠️ Usage

* **Memory**: Navigate to `/memory` to upload images/videos and search your memories using AI.
* **EYE AI**: Go to `/eye-ai` for chat, image analysis (vision), and text generation.
* **Inference**: Use `/inference` to run object detection with YOLO-E models on uploaded images.
* **Annotation**: Access `/annotation` to create and manage image annotation projects and tasks, potentially integrating with CVAT.
* **Training**: Visit `/training` to manage datasets and train custom YOLO-E models (feature in development).

---

## 💡 System Modes (Vision)

The project aims for different operational modes:

* **Heavy Load Mode**: For users with high compute (GPU recommended).
* **Light Mode**: Optimized for basic inference, runnable on lower-spec machines.
* **God Mode**: Full capabilities unlocked.

*(Currently, the system primarily targets Heavy Load Mode with GPU acceleration.)*

---

## 🤝 Contributing

Contributions are welcome! Please follow standard GitHub fork & pull request workflows. See `TODO.md` for planned features and improvements.

*(Consider adding a CONTRIBUTING.md file with guidelines later)*

---

## ☕ License

EYE is licensed under the **COFFEE LICENSE** ☕.

* **Free for Personal Use**: Use freely for personal, non-commercial projects.
* **Commercial Use Requires Coffee**: If you use EYE to make money, please buy the author ([Anurag Atulya](mailto:eight.atulya@gmail.com)) a good coffee! The amount and method are flexible.

See the [LICENSE](LICENSE) file for full details.

---

**EYE for Humanity — I love machines, AI, humans, coffee, leaf. 8 is my north star.** ☕ - Anurag Atulya
