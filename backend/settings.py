"""
Settings module for EYE backend
Loads configuration from environment variables and YAML config
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Environment
    eye_environment: str = "development"
    eye_debug: bool = True
    eye_log_level: str = "DEBUG"
    
    # Backend
    eye_backend_port: int = 8001
    eye_backend_host: str = "0.0.0.0"
    
    # Database
    eye_database_host: str = "db"
    eye_database_port: int = 5433
    eye_database_name: str = "vision"
    eye_database_user: str = "vision"
    eye_database_password: str = "vision"
    
    # Redis
    eye_redis_host: str = "redis"
    eye_redis_port: int = 6380
    
    # MinIO/S3
    eye_minio_host: str = "minio"
    eye_minio_port: int = 9002
    eye_minio_access_key: str = "miniokey"
    eye_minio_secret_key: str = "miniopass123"
    eye_minio_bucket: str = "training-data"
    
    # CVAT
    eye_cvat_host: str = "cvat"
    eye_cvat_port: int = 8080
    eye_cvat_username: str = "admin"
    eye_cvat_password: str = "admin"
    eye_cvat_webhook_secret: str = "change-me"
    
    # JWT
    eye_jwt_secret_key: str = "change-me-in-production"
    eye_access_token_expire_minutes: int = 60
    
    @property
    def s3_bucket(self) -> str:
        return self.eye_minio_bucket
    
    @property
    def s3_endpoint(self) -> str:
        return f"http://{self.eye_minio_host}:{self.eye_minio_port}"
    
    @property
    def s3_access_key(self) -> str:
        return self.eye_minio_access_key
    
    @property
    def s3_secret_key(self) -> str:
        return self.eye_minio_secret_key
    
    @property
    def s3_region(self) -> str:
        return "us-east-1"
    
    @property
    def cvat_base_url(self) -> str:
        return f"http://{self.eye_cvat_host}:{self.eye_cvat_port}"
    
    @property
    def cvat_username(self) -> str:
        return self.eye_cvat_username
    
    @property
    def cvat_password(self) -> str:
        return self.eye_cvat_password
    
    @property
    def cvat_webhook_secret(self) -> str:
        return self.eye_cvat_webhook_secret
    
    class Config:
        env_file = ".env"
        case_sensitive = False


def get_settings() -> Settings:
    """Get application settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()
