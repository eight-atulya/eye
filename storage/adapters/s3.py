from __future__ import annotations

import os
from typing import Optional

import boto3
from botocore.client import Config


class S3Adapter:
    def __init__(
        self,
        bucket: str,
        endpoint_url: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        region: str = "us-east-1",
        create_bucket: bool = True,
    ) -> None:
        self.bucket = bucket
        self.endpoint_url = endpoint_url
        self.region = region
        self.session = boto3.session.Session()
        self.client = self.session.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key or os.getenv("S3_ACCESS_KEY"),
            aws_secret_access_key=secret_key or os.getenv("S3_SECRET_KEY"),
            region_name=region,
            config=Config(signature_version="s3v4"),
        )
        if create_bucket:
            self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        existing = [b["Name"] for b in self.client.list_buckets().get("Buckets", [])]
        if self.bucket not in existing:
            # For MinIO/us-east-1, no LocationConstraint required
            try:
                self.client.create_bucket(Bucket=self.bucket)
            except self.client.exceptions.BucketAlreadyOwnedByYou:
                pass

    def upload(self, local_path: str, key: str) -> str:
        self.client.upload_file(local_path, self.bucket, key)
        return f"s3://{self.bucket}/{key}"

    def upload_bytes(self, data: bytes, key: str, content_type: Optional[str] = None) -> str:
        extra = {"ContentType": content_type} if content_type else None
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data, **(extra or {}))
        return f"s3://{self.bucket}/{key}"

    def download(self, key: str, local_path: str) -> str:
        self.client.download_file(self.bucket, key, local_path)
        return local_path
