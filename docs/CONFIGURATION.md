# EYE Configuration System

## Overview

EYE uses a **centralized configuration system** that eliminates confusion and provides a single source of truth for all configuration across the platform.

## Key Principles

1. **Single Source of Truth**: All configuration in `config/eye.yaml`
2. **Auto-Generation**: Docker Compose and environment files are generated automatically
3. **Type Safety**: Pydantic validation ensures configuration correctness
4. **Environment Aware**: Development, staging, and production configurations
5. **No Manual Editing**: Never edit generated files directly

## Quick Start

### 1. Edit Configuration
```bash
# Edit the main configuration file
nano config/eye.yaml
```

### 2. Generate Files
```bash
# Generate Docker Compose and environment files
python scripts/generate-config.py
```

### 3. Start Services
```bash
# Start all services
make up
# or on Windows
cd scripts && ./start.ps1
```

## Configuration Structure

### Main Configuration File
```yaml
# config/eye.yaml
app:
  name: "EYE"
  version: "0.1.0"
  description: "AI-first computer vision workspace"

environments:
  development:
    debug: true
    log_level: "DEBUG"
  production:
    debug: false
    log_level: "INFO"

services:
  backend:
    port: 8000
    host: "0.0.0.0"
  database:
    host: "db"
    port: 5432
    name: "vision"
    user: "vision"
    password: "vision"

features:
  cvat_integration: true
  gpu_training: true
  model_deployment: true
```

### Generated Files
- `docker-compose.yml` - Generated from central config
- `backend/.env` - Backend environment variables
- `frontend/.env.local` - Frontend environment variables

## Development Workflow

### 1. Configuration Changes
```bash
# Edit configuration
nano config/eye.yaml

# Validate syntax
python -c "import yaml; yaml.safe_load(open('config/eye.yaml'))"

# Regenerate files
python scripts/generate-config.py

# Restart services
make up
```

### 2. Environment Variables
```bash
# Override specific settings
export EYE_BACKEND_PORT=8001
export EYE_DATABASE_PASSWORD=newpassword

# Generate with overrides
python scripts/generate-config.py
```

### 3. Feature Flags
```yaml
# config/eye.yaml
features:
  cvat_integration: true
  gpu_training: true
  model_deployment: false  # Disable for development
```

## Available Commands

### Configuration Management
```bash
# Generate configuration files
python scripts/generate-config.py

# Validate configuration
python -c "from config.settings import get_settings; print('Valid:', get_settings().app_name)"

# Check YAML syntax
python -c "import yaml; yaml.safe_load(open('config/eye.yaml'))"
```

### Docker Operations
```bash
# Start services (auto-generates config)
make up

# Stop services
make down

# View logs
make logs

# Health check
make health
```

### Development
```bash
# Development mode
make dev

# Backend only
make dev-backend

# Frontend only
make dev-frontend
```

## Environment Management

### Development
```yaml
environments:
  development:
    debug: true
    log_level: "DEBUG"
    reload: true
```

### Production
```yaml
environments:
  production:
    debug: false
    log_level: "INFO"
    reload: false
```

### Environment Variables
```bash
# Override any setting with EYE_ prefix
export EYE_BACKEND_PORT=8001
export EYE_DATABASE_PASSWORD=secure_password
export EYE_ENVIRONMENT=production
```

## Service Configuration

### Backend
```yaml
services:
  backend:
    port: 8000
    host: "0.0.0.0"
    workers: 1
    timeout: 300
```

### Database
```yaml
services:
  database:
    host: "db"
    port: 5432
    name: "vision"
    user: "vision"
    password: "vision"
```

### Redis
```yaml
services:
  redis:
    host: "redis"
    port: 6379
    db: 0
```

### MinIO/S3
```yaml
services:
  minio:
    host: "minio"
    port: 9000
    access_key: "miniokey"
    secret_key: "miniopass123"
    bucket: "training-data"
```

## Feature Flags

### Available Features
```yaml
features:
  cvat_integration: true    # CVAT annotation tool
  gpu_training: true        # GPU acceleration
  model_deployment: true    # Model deployment
  real_time_monitoring: true # Live metrics
```

### Using Feature Flags
```python
# In your code
from config.settings import is_feature_enabled

if is_feature_enabled('cvat_integration'):
    # CVAT-specific code
    pass
```

## Security

### Secrets Management
- Store secrets in environment variables
- Use `.env` files for local development
- Never commit secrets to version control
- Use different secrets per environment

### Environment Variables
```bash
# Development
export EYE_JWT_SECRET_KEY=dev_secret_key

# Production
export EYE_JWT_SECRET_KEY=super_secure_production_key
```

## Troubleshooting

### Configuration Issues
```bash
# Check YAML syntax
python -c "import yaml; yaml.safe_load(open('config/eye.yaml'))"

# Validate Pydantic settings
python -c "from config.settings import get_settings; print(get_settings())"

# Compare generated vs backup
diff docker-compose.yml docker-compose.yml.backup
```

### Service Issues
```bash
# Check service health
make health

# View logs
make logs

# Restart services
make down && make up
```

### Common Problems
1. **YAML syntax errors**: Check indentation and quotes
2. **Missing environment variables**: Ensure all required variables are set
3. **Port conflicts**: Change ports in `config/eye.yaml`
4. **Docker issues**: Run `make clean` and restart

## Migration Guide

### From Old System
1. **Backup existing configuration**
2. **Edit `config/eye.yaml`** with your settings
3. **Generate new configuration**
4. **Test in development**
5. **Deploy to production**

### Example Migration
```bash
# Old way
# Edit docker-compose.yml directly
# Edit backend/.env manually
# Edit frontend/.env.local manually

# New way
# Edit config/eye.yaml
python scripts/generate-config.py
make up
```

## Best Practices

1. **Always edit `config/eye.yaml`** for configuration changes
2. **Never edit generated files directly**
3. **Use environment variables for secrets**
4. **Test configuration changes in development first**
5. **Validate configuration before deployment**
6. **Use feature flags for optional functionality**
7. **Keep configuration files in version control**
8. **Document custom configuration choices**

## Support

For configuration issues:
1. Check this documentation
2. Validate configuration syntax
3. Check service logs
4. Review environment variables
5. Test in development environment

## Examples

### Custom Port Configuration
```yaml
services:
  backend:
    port: 8001  # Change from default 8000
  frontend:
    port: 3001  # Change from default 3000
```

### Disable Features
```yaml
features:
  cvat_integration: false  # Disable CVAT
  gpu_training: false      # Disable GPU training
```

### Production Configuration
```yaml
environments:
  production:
    debug: false
    log_level: "WARNING"
    reload: false
```

This configuration system provides a robust, maintainable, and confusion-free approach to managing EYE's configuration across all environments and services.



