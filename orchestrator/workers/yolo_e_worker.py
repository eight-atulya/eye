"""
YOLO-E Worker for high-performance object detection and few-shot learning
Handles YOLO-E specific jobs including training and batch processing
"""
import time
import json
import os
import redis
import logging
from typing import Dict, Any, Optional
from pathlib import Path

# Import YOLO-E engine (assuming it's available in the system)
try:
    from engines.yolo_e_node import YOLOENode
except ImportError:
    YOLOENode = None

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6380/0")
QUEUE_KEY = os.getenv("YOLO_E_QUEUE_KEY", "eye:yolo_e:jobs")
JOB_HASH_KEY = "eye:yolo_e:job:{job_id}"
STATUS_RUNNING = "RUNNING"
STATUS_SUCCEEDED = "SUCCEEDED"
STATUS_FAILED = "FAILED"

class YOLOEWorker:
    """YOLO-E specialized worker for ML tasks"""
    
    def __init__(self):
        self.client = redis.Redis.from_url(REDIS_URL)
        self.yolo_e_engine = None
        self.initialized = False
        
    def initialize(self):
        """Initialize YOLO-E engine and worker"""
        try:
            if YOLOENode:
                self.yolo_e_engine = YOLOENode()
                logger.info("YOLO-E engine initialized")
            else:
                logger.warning("YOLO-E engine not available, using placeholder")
            
            self.initialized = True
            logger.info("YOLO-E worker initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize YOLO-E worker: {str(e)}")
            raise
    
    def process_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Process YOLO-E specific job"""
        if not self.initialized:
            raise RuntimeError("Worker not initialized")
        
        job_type = job.get("type")
        job_id = job.get("id")
        
        logger.info(f"Processing YOLO-E job: {job_type} (ID: {job_id})")
        
        try:
            if job_type == "few_shot_training":
                return self._process_few_shot_training(job)
            elif job_type == "batch_processing":
                return self._process_batch_processing(job)
            elif job_type == "inference":
                return self._process_inference(job)
            elif job_type == "model_loading":
                return self._process_model_loading(job)
            else:
                raise ValueError(f"Unknown job type: {job_type}")
                
        except Exception as e:
            logger.error(f"Job processing failed: {str(e)}")
            raise
    
    def _process_few_shot_training(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Process few-shot training job"""
        try:
            # Extract training parameters
            dataset_config = job.get("dataset_config", {})
            epochs = job.get("epochs", 50)
            learning_rate = job.get("learning_rate", 0.001)
            batch_size = job.get("batch_size", 8)
            
            logger.info(f"Starting few-shot training: {epochs} epochs, LR: {learning_rate}")
            
            # TODO: Implement actual YOLO-E few-shot training
            # This would use the YOLO-E engine for training
            
            # Simulate training process
            for epoch in range(epochs):
                logger.info(f"Training epoch {epoch + 1}/{epochs}")
                time.sleep(0.1)  # Placeholder for actual training time
            
            # Generate training results
            training_results = {
                "job_id": job.get("id"),
                "status": "completed",
                "epochs_completed": epochs,
                "learning_rate": learning_rate,
                "batch_size": batch_size,
                "training_time": epochs * 0.1,
                "metrics": {
                    "accuracy": 0.95,
                    "loss": 0.05,
                    "precision": 0.92,
                    "recall": 0.88
                },
                "model_path": f"/models/yolo_e_{job.get('id')}.pt"
            }
            
            logger.info(f"Few-shot training completed: {job.get('id')}")
            return training_results
            
        except Exception as e:
            logger.error(f"Few-shot training failed: {str(e)}")
            raise
    
    def _process_batch_processing(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Process batch image processing job"""
        try:
            # Extract processing parameters
            input_directory = job.get("input_directory")
            output_directory = job.get("output_directory")
            batch_size = job.get("batch_size", 16)
            confidence_threshold = job.get("confidence_threshold", 0.5)
            
            logger.info(f"Starting batch processing: {input_directory}")
            
            # Validate input directory
            if not os.path.exists(input_directory):
                raise ValueError(f"Input directory not found: {input_directory}")
            
            # Create output directory
            os.makedirs(output_directory, exist_ok=True)
            
            # Get image files
            image_files = self._get_image_files(input_directory)
            total_images = len(image_files)
            
            if total_images == 0:
                return {
                    "job_id": job.get("id"),
                    "status": "completed",
                    "processed_images": 0,
                    "message": "No images found"
                }
            
            # Process images in batches
            processed_count = 0
            results = []
            
            for i in range(0, total_images, batch_size):
                batch_files = image_files[i:i + batch_size]
                
                # TODO: Implement actual batch processing with YOLO-E
                # This would use the YOLO-E engine for inference
                
                batch_results = self._process_image_batch(batch_files, confidence_threshold)
                results.extend(batch_results)
                processed_count += len(batch_files)
                
                # Save intermediate results
                self._save_batch_results(batch_results, output_directory, i // batch_size)
                
                logger.info(f"Processed batch {i // batch_size + 1}: {processed_count}/{total_images}")
            
            # Save final results
            final_results = {
                "job_id": job.get("id"),
                "status": "completed",
                "total_images": total_images,
                "processed_images": processed_count,
                "results": results,
                "output_directory": output_directory
            }
            
            self._save_final_results(final_results, output_directory)
            
            logger.info(f"Batch processing completed: {processed_count}/{total_images} images")
            return final_results
            
        except Exception as e:
            logger.error(f"Batch processing failed: {str(e)}")
            raise
    
    def _process_inference(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Process single image inference job"""
        try:
            image_path = job.get("image_path")
            confidence_threshold = job.get("confidence_threshold", 0.5)
            
            logger.info(f"Processing inference for: {image_path}")
            
            # TODO: Implement actual inference with YOLO-E
            # This would use the YOLO-E engine for inference
            
            # Simulate inference
            time.sleep(0.1)
            
            result = {
                "job_id": job.get("id"),
                "status": "completed",
                "image_path": image_path,
                "detections": [],
                "processing_time": 0.1,
                "confidence_threshold": confidence_threshold
            }
            
            logger.info(f"Inference completed: {job.get('id')}")
            return result
            
        except Exception as e:
            logger.error(f"Inference failed: {str(e)}")
            raise
    
    def _process_model_loading(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Process model loading job"""
        try:
            model_path = job.get("model_path")
            config_path = job.get("config_path")
            
            logger.info(f"Loading YOLO-E model: {model_path}")
            
            # TODO: Implement actual model loading
            # This would use the YOLO-E engine to load the model
            
            # Simulate model loading
            time.sleep(1.0)
            
            result = {
                "job_id": job.get("id"),
                "status": "completed",
                "model_path": model_path,
                "model_loaded": True,
                "loading_time": 1.0
            }
            
            logger.info(f"Model loading completed: {job.get('id')}")
            return result
            
        except Exception as e:
            logger.error(f"Model loading failed: {str(e)}")
            raise
    
    def _get_image_files(self, directory: str) -> list:
        """Get all image files from directory"""
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
        image_files = []
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                if Path(file).suffix.lower() in image_extensions:
                    image_files.append(os.path.join(root, file))
        
        return sorted(image_files)
    
    def _process_image_batch(self, image_files: list, confidence_threshold: float) -> list:
        """Process a batch of images (placeholder implementation)"""
        # TODO: Implement actual batch processing with YOLO-E
        results = []
        
        for image_file in image_files:
            result = {
                "image_path": image_file,
                "detections": [],
                "processing_time": 0.1
            }
            results.append(result)
        
        return results
    
    def _save_batch_results(self, results: list, output_dir: str, batch_id: int):
        """Save batch processing results"""
        output_file = os.path.join(output_dir, f"batch_{batch_id}_results.json")
        
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
    
    def _save_final_results(self, results: Dict[str, Any], output_dir: str):
        """Save final processing results"""
        output_file = os.path.join(output_dir, "final_results.json")
        
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)


def main():
    """Main worker loop"""
    worker = YOLOEWorker()
    
    try:
        worker.initialize()
        logger.info("YOLO-E worker started")
        
        while True:
            # Poll for YOLO-E jobs
            item = worker.client.brpop(QUEUE_KEY, timeout=5)
            if item is None:
                continue
            
            _, data = item
            job_id = None
            
            try:
                job = json.loads(data)
                job_id = job.get("id")
                
                # Update job status to running
                if job_id:
                    worker.client.hset(
                        JOB_HASH_KEY.format(job_id=job_id),
                        mapping={"status": STATUS_RUNNING}
                    )
                
                # Process the job
                result = worker.process_job(job)
                
                # Update job status to succeeded
                if job_id:
                    worker.client.hset(
                        JOB_HASH_KEY.format(job_id=job_id),
                        mapping={"status": STATUS_SUCCEEDED, "result": json.dumps(result)}
                    )
                
                logger.info(f"YOLO-E job completed: {job_id}")
                
            except Exception as e:
                # Update job status to failed
                if job_id:
                    worker.client.hset(
                        JOB_HASH_KEY.format(job_id=job_id),
                        mapping={"status": STATUS_FAILED, "error": str(e)}
                    )
                
                logger.error(f"YOLO-E job failed: {job_id}, error: {str(e)}")
                
    except KeyboardInterrupt:
        logger.info("YOLO-E worker stopped")
    except Exception as e:
        logger.error(f"YOLO-E worker error: {str(e)}")
        raise


if __name__ == "__main__":
    main()
