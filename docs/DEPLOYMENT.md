# EYE Deployment Guide

## 🏗️ Production Deployment

### Prerequisites
- Docker and Docker Compose installed
- NVIDIA GPU with drivers (for AI features)
- Minimum 16GB RAM
- 50GB+ storage space
- Domain name (optional)

### 1. Environment Setup

#### Clone Repository
```bash
git clone https://github.com/your-username/EYE.git
cd EYE
```

#### Generate Production Configuration
```bash
# Copy production template
cp config/eye.yaml.production config/eye.yaml

# Edit configuration
nano config/eye.yaml
```

#### Production Configuration Example
```yaml
app:
  name: "EYE Production"
  version: "1.0.0"
  environment: "production"

services:
  backend:
    port: 8001
    host: "0.0.0.0"
    workers: 4
  
  frontend:
    port: 3003
    host: "0.0.0.0"
  
  database:
    host: "db"
    port: 5432
    name: "eye_production"
    user: "eye_user"
    password: "your-secure-password"
  
  ollama:
    host: "ollama"
    port: 11434
    default_model: "gemma3:12b"
    enable_gpu: true
    max_loaded_models: 2
  
  minio:
    access_key: "your-access-key"
    secret_key: "your-secret-key"
    bucket: "eye-production"

features:
  ollama_integration: true
  gpu_training: true
  cvat_integration: true
  monitoring: true
  ssl: true
```

### 2. Security Configuration

#### Generate SSL Certificates
```bash
# Using Let's Encrypt (recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Or self-signed certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

#### Update Docker Compose for SSL
```yaml
# Add to docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - frontend
      - backend
```

#### Nginx Configuration
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3003;
    }
    
    upstream backend {
        server backend:8001;
    }
    
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl;
        server_name your-domain.com;
        
        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
        
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### 3. Database Setup

#### PostgreSQL Configuration
```bash
# Create production database
docker-compose exec db psql -U postgres -c "CREATE DATABASE eye_production;"
docker-compose exec db psql -U postgres -c "CREATE USER eye_user WITH PASSWORD 'your-secure-password';"
docker-compose exec db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE eye_production TO eye_user;"
```

#### Database Migrations
```bash
# Run migrations
docker-compose exec backend alembic upgrade head
```

### 4. Storage Configuration

#### MinIO Production Setup
```bash
# Create production buckets
docker-compose exec minio mc mb /data/training-data
docker-compose exec minio mc mb /data/models
docker-compose exec minio mc mb /data/annotations
docker-compose exec minio mc mb /data/exports
```

### 5. Monitoring Setup

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'eye-backend'
    static_configs:
      - targets: ['backend:8001']
  
  - job_name: 'eye-database'
    static_configs:
      - targets: ['db:5432']
  
  - job_name: 'eye-ollama'
    static_configs:
      - targets: ['ollama:11434']
```

#### Grafana Dashboard
```bash
# Add Grafana service to docker-compose.yml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
```

### 6. Backup Strategy

#### Database Backup
```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U postgres eye_production > backup_${DATE}.sql
gzip backup_${DATE}.sql
aws s3 cp backup_${DATE}.sql.gz s3://your-backup-bucket/
EOF

chmod +x backup-db.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /path/to/EYE/backup-db.sh
```

#### MinIO Backup
```bash
# Backup MinIO data
docker-compose exec minio mc mirror /data/ /backup/
```

### 7. Deployment Commands

#### Full Production Deployment
```bash
# Generate configuration
python scripts/generate-config.py

# Build and start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify deployment
docker-compose ps
curl https://your-domain.com/health
```

#### Rolling Updates
```bash
# Update specific service
docker-compose build backend
docker-compose up -d backend

# Update all services
docker-compose build --no-cache
docker-compose up -d
```

### 8. Health Checks

#### Service Health Monitoring
```bash
# Backend health
curl https://your-domain.com/health

# Ollama health
curl https://your-domain.com/api/v1/ollama/health

# Database health
docker-compose exec db pg_isready -U postgres

# MinIO health
docker-compose exec minio mc admin info
```

#### Automated Health Checks
```bash
# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
services=("backend" "frontend" "db" "minio" "ollama")
for service in "${services[@]}"; do
    if ! docker-compose ps $service | grep -q "Up"; then
        echo "Service $service is down!"
        # Send alert
        curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
             -H "Content-Type: application/json" \
             -d '{"text":"EYE service '$service' is down!"}'
    fi
done
EOF

chmod +x health-check.sh

# Schedule health checks
crontab -e
# Add: */5 * * * * /path/to/EYE/health-check.sh
```

## 🐳 Docker Swarm Deployment

### Initialize Swarm
```bash
docker swarm init
```

### Deploy Stack
```bash
# Create production stack
docker stack deploy -c docker-compose.prod.yml eye-production
```

### Scale Services
```bash
# Scale backend
docker service scale eye-production_backend=3

# Scale frontend
docker service scale eye-production_frontend=2
```

## ☸️ Kubernetes Deployment

### Create Namespace
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: eye-production
```

### Deploy Services
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eye-backend
  namespace: eye-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: eye-backend
  template:
    metadata:
      labels:
        app: eye-backend
    spec:
      containers:
      - name: backend
        image: eye-backend:latest
        ports:
        - containerPort: 8001
        env:
        - name: DATABASE_URL
          value: "postgresql://eye_user:password@db:5432/eye_production"
```

### Ingress Configuration
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: eye-ingress
  namespace: eye-production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: eye-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: eye-frontend
            port:
              number: 3003
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: eye-backend
            port:
              number: 8001
```

## 🔧 Environment-Specific Configurations

### Development
```bash
# Use development configuration
cp config/eye.yaml.dev config/eye.yaml
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Staging
```bash
# Use staging configuration
cp config/eye.yaml.staging config/eye.yaml
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### Production
```bash
# Use production configuration
cp config/eye.yaml.production config/eye.yaml
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Performance Optimization

### Resource Limits
```yaml
# Add to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
  
  ollama:
    deploy:
      resources:
        limits:
          memory: 8G
          cpus: '4.0'
        reservations:
          memory: 4G
          cpus: '2.0'
```

### Caching Configuration
```yaml
# Redis configuration
services:
  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## 🚨 Disaster Recovery

### Backup Strategy
1. **Database**: Daily automated backups
2. **MinIO**: S3-compatible backup to external storage
3. **Configuration**: Version-controlled in Git
4. **Models**: Backup to external storage

### Recovery Procedures
```bash
# Database recovery
docker-compose exec db psql -U postgres -c "DROP DATABASE eye_production;"
docker-compose exec db psql -U postgres -c "CREATE DATABASE eye_production;"
gunzip backup_20240101_020000.sql.gz
docker-compose exec -T db psql -U postgres eye_production < backup_20240101_020000.sql

# MinIO recovery
docker-compose exec minio mc mirror /backup/ /data/
```

## 📈 Scaling Guidelines

### Horizontal Scaling
- **Backend**: Scale to 3-5 replicas
- **Frontend**: Scale to 2-3 replicas
- **Worker**: Scale based on GPU availability

### Vertical Scaling
- **Backend**: 2-4GB RAM, 1-2 CPUs
- **Ollama**: 8-16GB RAM, 2-4 CPUs
- **Database**: 4-8GB RAM, 2-4 CPUs

---

**Production Ready**: This guide ensures EYE is deployed securely and efficiently in production environments.
