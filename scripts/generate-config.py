#!/usr/bin/env python3
"""
Configuration Generator
Generates Docker Compose and environment files from central config/eye.yaml
"""
import os
import sys
import yaml
from pathlib import Path
from typing import Dict, Any

def load_config(config_path: str = "config/eye.yaml") -> Dict[str, Any]:
    """Load the central configuration file"""
    config_file = Path(config_path)
    
    if not config_file.exists():
        print(f"Error: Configuration file not found: {config_path}")
        sys.exit(1)
    
    with open(config_file, 'r') as f:
        return yaml.safe_load(f)

def generate_docker_compose(config: Dict[str, Any], output_path: str = "docker-compose.yml"):
    """Generate Docker Compose file from configuration"""
    
    compose_config = {
        'services': {},
        'volumes': {
            'pgdata': {},
            'minio_data': {},
            'cvat_db_data': {}
        }
    }
    
    services = config['services']
    
    # Backend service
    compose_config['services']['backend'] = {
        'build': {
            'context': '.',
            'dockerfile': 'backend/Dockerfile'
        },
        'command': f"uvicorn main:app --host {services['backend']['host']} --port {services['backend']['port']} --reload --reload-dir /app/backend",
        'ports': [f"{services['backend']['port']}:{services['backend']['port']}"],
        'environment': [
            'PYTHONUNBUFFERED=1',
            f"EYE_ENVIRONMENT={config['environments']['development'].get('environment', 'development')}"
        ],
        'depends_on': ['db', 'redis']
    }
    
    # Frontend service
    compose_config['services']['frontend'] = {
        'build': {
            'context': './frontend',
            'dockerfile': 'Dockerfile'
        },
        'command': f'npm run dev -- -p {services["frontend"]["port"]}',
        'ports': [f"{services['frontend']['port']}:{services['frontend']['port']}"],
        'environment': [
            'NODE_ENV=development',
            'CHOKIDAR_USEPOLLING=true',
            'WATCHPACK_POLLING=true',
            f"NEXT_PUBLIC_API_URL=http://localhost:{services['backend']['port']}"
        ],
        'depends_on': ['backend'],
        'volumes': [
            './frontend:/app',
            '/app/node_modules'
        ]
    }
    
    # Database service
    db = services['database']
    compose_config['services']['db'] = {
        'image': 'postgres:16-alpine',
        'environment': [
            f"POSTGRES_USER={db['user']}",
            f"POSTGRES_PASSWORD={db['password']}",
            f"POSTGRES_DB={db['name']}"
        ],
        'ports': [f"{db['port']}:{db['port']}"],
        'volumes': ['pgdata:/var/lib/postgresql/data']
    }
    
    # Redis service
    redis = services['redis']
    compose_config['services']['redis'] = {
        'image': 'redis:7-alpine',
        'ports': [f"{redis['port']}:{redis['port']}"],
        'environment': [f"REDIS_DB={redis['db']}"]
    }
    
    # MinIO service
    minio = services['minio']
    compose_config['services']['minio'] = {
        'image': 'minio/minio:RELEASE.2024-09-22T00-33-43Z',
        'command': f'server /data --console-address ":{minio["console_port"]}"',
        'environment': [
            f"MINIO_ROOT_USER={minio['access_key']}",
            f"MINIO_ROOT_PASSWORD={minio['secret_key']}"
        ],
        'ports': [
            f"{minio['port']}:{minio['port']}",
            f"{minio['console_port']}:{minio['console_port']}"
        ],
        'volumes': ['minio_data:/data'],
        'healthcheck': {
            'test': ['CMD', 'curl', '-f', f'http://localhost:{minio["port"]}/minio/health/live'],
            'interval': '10s',
            'timeout': '5s',
            'retries': 5
        }
    }
    
    # Prometheus service
    compose_config['services']['prometheus'] = {
        'build': {
            'context': './monitoring/prometheus',
            'dockerfile': 'Dockerfile'
        },
        'ports': [f"{services['prometheus']['port']}:{services['prometheus']['port']}"],
        'depends_on': ['backend']
    }
    
    # Worker service
    compose_config['services']['worker'] = {
        'build': {
            'context': './orchestrator',
            'dockerfile': 'Dockerfile'
        },
        'working_dir': '/app/orchestrator',
        'command': ['python3.11', '-u', 'workers/redis_worker.py'],
        'depends_on': ['redis', 'minio'],
        'gpus': 'all',
        'environment': [
            'NVIDIA_VISIBLE_DEVICES=all',
            'NVIDIA_DRIVER_CAPABILITIES=compute,utility',
            f"EYE_ENVIRONMENT={config['environments']['development'].get('environment', 'development')}"
        ]
    }
    
    # CVAT services (if enabled)
    if config.get('feature_flags', {}).get('cvat_integration', True):
        # Add CVAT services from original docker-compose.yml
        # (Keeping existing CVAT configuration for now)
        pass
    
    # Write the generated compose file to root (for Docker Compose compatibility)
    with open(output_path, 'w') as f:
        yaml.dump(compose_config, f, default_flow_style=False, sort_keys=False)
    
    # Also write to config directory for reference
    config_path = "config/docker-compose.generated.yml"
    with open(config_path, 'w') as f:
        yaml.dump(compose_config, f, default_flow_style=False, sort_keys=False)
    
    print(f"Generated Docker Compose file: {output_path}")
    print(f"Generated reference file: {config_path}")

def generate_env_files(config: Dict[str, Any]):
    """Generate environment files for different services"""
    
    # Backend .env
    backend_env = {
        'EYE_ENVIRONMENT': 'development',
        'EYE_DEBUG': 'true',
        'EYE_LOG_LEVEL': 'DEBUG',
        'EYE_BACKEND_PORT': config['services']['backend']['port'],
        'EYE_BACKEND_HOST': config['services']['backend']['host'],
        'EYE_DATABASE_HOST': config['services']['database']['host'],
        'EYE_DATABASE_PORT': config['services']['database']['port'],
        'EYE_DATABASE_NAME': config['services']['database']['name'],
        'EYE_DATABASE_USER': config['services']['database']['user'],
        'EYE_DATABASE_PASSWORD': config['services']['database']['password'],
        'EYE_REDIS_HOST': config['services']['redis']['host'],
        'EYE_REDIS_PORT': config['services']['redis']['port'],
        'EYE_MINIO_HOST': config['services']['minio']['host'],
        'EYE_MINIO_PORT': config['services']['minio']['port'],
        'EYE_MINIO_ACCESS_KEY': config['services']['minio']['access_key'],
        'EYE_MINIO_SECRET_KEY': config['services']['minio']['secret_key'],
        'EYE_MINIO_BUCKET': config['services']['minio']['bucket'],
        'EYE_CVAT_HOST': config['services']['cvat']['host'],
        'EYE_CVAT_PORT': config['services']['cvat']['port'],
        'EYE_CVAT_USERNAME': config['services']['cvat']['username'],
        'EYE_CVAT_PASSWORD': config['services']['cvat']['password'],
        'EYE_JWT_SECRET_KEY': config.get('security', {}).get('jwt', {}).get('secret_key', 'change-me'),
        'EYE_ACCESS_TOKEN_EXPIRE_MINUTES': config.get('security', {}).get('jwt', {}).get('access_token_expire_minutes', 60)
    }
    
    with open('backend/.env', 'w') as f:
        for key, value in backend_env.items():
            f.write(f"{key}={value}\n")
    
    print("Generated backend/.env")
    
    # Frontend .env.local
    frontend_env = {
        'NEXT_PUBLIC_API_URL': f"http://localhost:{config['services']['backend']['port']}",
        'NEXT_PUBLIC_APP_NAME': config['app']['name'],
        'NEXT_PUBLIC_APP_VERSION': config['app']['version']
    }
    
    with open('frontend/.env.local', 'w') as f:
        for key, value in frontend_env.items():
            f.write(f"{key}={value}\n")
    
    print("Generated frontend/.env.local")

def main():
    """Main function"""
    if len(sys.argv) > 1:
        config_path = sys.argv[1]
    else:
        config_path = "config/eye.yaml"
    
    print(f"Loading configuration from: {config_path}")
    config = load_config(config_path)
    
    print("Generating configuration files...")
    generate_docker_compose(config)
    generate_env_files(config)
    
    print("Configuration generation complete!")
    print("\nNext steps:")
    print("1. Review generated files")
    print("2. Run: make up (or docker-compose up -d --build)")
    print("3. Edit config/eye.yaml to modify configuration")

if __name__ == "__main__":
    main()
