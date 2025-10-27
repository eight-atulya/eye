FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install Python 3.11 and pip on Ubuntu 22.04 base
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    python3.11 python3.11-distutils python3-pip ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app/orchestrator

RUN python3.11 -m pip install --no-cache-dir --upgrade pip \
 && python3.11 -m pip install --no-cache-dir redis==5.0.8

COPY . /app/orchestrator

CMD ["python3.11", "-u", "workers/redis_worker.py"]
