# EYE Configuration Management

This directory contains the centralized configuration system for EYE - a single source of truth for all configuration across the platform.

## Overview

The EYE configuration system provides:
- **Single Source of Truth**: All configuration in `eye.yaml`
- **Environment Overrides**: Development, staging, production settings
- **Type Safety**: Pydantic validation and type checking
- **Auto-Generation**: Docker Compose and environment files
- **Validation**: Configuration syntax and value validation

## Files

### Core Configuration
- `eye.yaml` - Main configuration file (single source of truth)
- `settings.py` - Pydantic settings classes and validation
- `docker-compose.generated.yml` - Auto-generated Docker Compose file

### Scripts
- `../scripts/generate-config.py` - Configuration generation script

## Usage

### 1. Edit Configuration
Edit `config/eye.yaml` to modify any system configuration:

```yaml
# Application metadata
app:
  name: "EYE"
  version: "0.1.0"

# Service ports
services:
  backend:
    port: 8000
  frontend:
    port: 3000

# Feature flags
features:
  cvat_integration: true
  gpu_training: true
```

### 2. Generate Configuration Files
```bash
# Generate Docker Compose and environment files
python3 scripts/generate-config.py

# Or use the Makefile
make generate-config
```

### 3. Start Services
```bash
# Start with generated configuration
make up

# Or directly
docker-compose -f config/docker-compose.generated.yml up -d --build
```

### 4. Validate Configuration
```bash
# Validate YAML syntax
make config-validate

# Validate Pydantic settings
make validate-config
```

## Configuration Structure

### Application Settings
```yaml
app:
  name: "EYE"
  version: "0.1.0"
  description: "AI-first computer vision workspace"
  author: "Anurag Atulya"
```

### Environment Configuration
```yaml
environments:
  development:
    debug: true
    log_level: "DEBUG"
    
  production:
    debug: false
    log_level: "INFO"
```

### Service Configuration
```yaml
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
```

### Feature Flags
```yaml
features:
  cvat_integration: true
  gpu_training: true
  model_deployment: true
  real_time_monitoring: true
```

## Environment Variables

The system supports environment variable overrides with the `EYE_` prefix:

```bash
# Override specific settings
export EYE_BACKEND_PORT=8001
export EYE_DATABASE_PASSWORD=newpassword
export EYE_ENVIRONMENT=production

# Generate configuration with overrides
python3 scripts/generate-config.py
```

## Integration

### Backend Integration
```python
# In your FastAPI app
from config.settings import get_settings

settings = get_settings()

# Use settings
database_url = settings.database.url
redis_url = settings.redis.url
```

### Frontend Integration
```typescript
// Environment variables are auto-generated
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const appName = process.env.NEXT_PUBLIC_APP_NAME;
```

## Best Practices

### 1. Single Source of Truth
- Always edit `eye.yaml` for configuration changes
- Never edit generated files directly
- Use environment variables only for secrets

### 2. Environment Management
- Use environment-specific overrides in `environments` section
- Keep development settings minimal
- Use strong passwords for production

### 3. Validation
- Always validate configuration before deployment
- Use type hints and Pydantic validation
- Test configuration changes in development first

### 4. Secrets Management
- Store secrets in environment variables
- Use `.env` files for local development
- Use secure secret management in production

## Migration Guide

### From Old System
1. **Backup existing configuration**
2. **Map old settings to new structure**
3. **Update `eye.yaml`**
4. **Generate new configuration files**
5. **Test in development environment**
6. **Deploy to production**

### Example Migration
```yaml
# Old: Multiple config files
# backend/config.py: database_url = "postgresql://..."
# docker-compose.yml: POSTGRES_PASSWORD=vision

# New: Single source of truth
# config/eye.yaml:
services:
  database:
    host: "db"
    port: 5432
    name: "vision"
    user: "vision"
    password: "vision"
```

## Troubleshooting

### Configuration Errors
```bash
# Check YAML syntax
python3 -c "import yaml; yaml.safe_load(open('config/eye.yaml'))"

# Validate Pydantic settings
python3 -c "from config.settings import get_settings; print(get_settings())"
```

### Docker Compose Issues
```bash
# Compare generated vs original
make config-diff

# Regenerate configuration
make generate-config
```

### Environment Variable Issues
```bash
# Check environment variables
env | grep EYE_

# Test configuration loading
python3 scripts/generate-config.py
```

## Development Workflow

1. **Edit** `config/eye.yaml`
2. **Generate** configuration files
3. **Validate** configuration
4. **Test** in development
5. **Deploy** to production

## Contributing

When adding new configuration options:
1. Add to `eye.yaml` with documentation
2. Update `settings.py` with Pydantic models
3. Update `generate-config.py` if needed
4. Test configuration generation
5. Update this documentation

## Security Notes

- Never commit secrets to version control
- Use environment variables for sensitive data
- Rotate secrets regularly
- Use different secrets per environment
- Validate all configuration inputs

