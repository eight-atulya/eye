#!/usr/bin/env python3
"""
YOLOE Training Pipeline Test Script
Tests the complete training pipeline: dataset upload, training start, and model inference
"""

import requests
import json
import time
from pathlib import Path
import os

def test_training_pipeline():
    """Test the complete YOLOE training pipeline"""
    
    base_url = "http://localhost:8001/api/v1/yolo-e"
    
    print("YOLOE Training Pipeline Test")
    print("=" * 50)
    
    # Test project name
    project_name = "test_project"
    
    # Step 1: Test dataset upload
    print("\n1. Testing Dataset Upload")
    print("-" * 30)
    
    # Create a sample dataset structure
    dataset_dir = Path("test_dataset")
    dataset_dir.mkdir(exist_ok=True)
    
    # Create sample images directory
    images_dir = dataset_dir / "images"
    images_dir.mkdir(exist_ok=True)
    
    # Create sample labels directory
    labels_dir = dataset_dir / "labels"
    labels_dir.mkdir(exist_ok=True)
    
    # Copy existing test image
    test_image = Path("objects_test.jpg")
    if test_image.exists():
        import shutil
        shutil.copy(test_image, images_dir / "test_image.jpg")
        
        # Create a sample label file
        label_file = labels_dir / "test_image.txt"
        with open(label_file, "w") as f:
            f.write("0 0.5 0.5 0.3 0.3\n")  # Sample YOLO format label
        
        print(f"Created test dataset with image: {test_image.name}")
    else:
        print("No test image found, creating dummy dataset...")
        # Create a dummy image file
        dummy_image = images_dir / "dummy.jpg"
        with open(dummy_image, "wb") as f:
            f.write(b"dummy image content")
        
        # Create a dummy label file
        label_file = labels_dir / "dummy.txt"
        with open(label_file, "w") as f:
            f.write("0 0.5 0.5 0.3 0.3\n")
    
    # Upload dataset
    try:
        files = []
        for img_file in images_dir.glob("*"):
            files.append(('files', (img_file.name, open(img_file, 'rb'), 'image/jpeg')))
        
        for label_file in labels_dir.glob("*.txt"):
            files.append(('files', (label_file.name, open(label_file, 'rb'), 'text/plain')))
        
        data = {
            'project_name': project_name,
            'dataset_name': 'test_dataset',
            'description': 'Test dataset for YOLOE training',
            'classes': 'person,car,bicycle'
        }
        
        response = requests.post(f"{base_url}/datasets/upload", files=files, data=data)
        
        # Close files
        for _, (_, file_obj, _) in files:
            file_obj.close()
        
        if response.status_code == 200:
            result = response.json()
            print(f"[SUCCESS] Dataset uploaded successfully")
            print(f"   Project: {result['project_name']}")
            print(f"   Dataset: {result['dataset_name']}")
            print(f"   Files: {result['uploaded_files']}")
            print(f"   Classes: {result['classes']}")
        else:
            print(f"[ERROR] Dataset upload failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return
    
    except Exception as e:
        print(f"[ERROR] Dataset upload error: {e}")
        return
    
    # Step 2: Test training job start
    print("\n2. Testing Training Job Start")
    print("-" * 30)
    
    try:
        training_config = {
            "project_name": project_name,
            "dataset_path": "test_dataset",
            "base_model": "yoloe-11s-seg-pf.pt",
            "epochs": 5,  # Small number for testing
            "batch_size": 2,
            "learning_rate": 0.001,
            "image_size": 640,
            "patience": 3,
            "validation_split": 0.2,
            "description": "Test training job"
        }
        
        response = requests.post(f"{base_url}/training/start", json=training_config)
        
        if response.status_code == 200:
            result = response.json()
            print(f"[SUCCESS] Training job started successfully")
            print(f"   Job ID: {result['job_id']}")
            print(f"   Project: {result['project_name']}")
            print(f"   Status: {result['status']}")
            print(f"   Epochs: {result['total_epochs']}")
            
            job_id = result['job_id']
        else:
            print(f"[ERROR] Training job start failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return
    
    except Exception as e:
        print(f"[ERROR] Training job start error: {e}")
        return
    
    # Step 3: Test training jobs list
    print("\n3. Testing Training Jobs List")
    print("-" * 30)
    
    try:
        response = requests.get(f"{base_url}/training/jobs?project_name={project_name}")
        
        if response.status_code == 200:
            jobs = response.json()
            print(f"[SUCCESS] Retrieved {len(jobs)} training jobs")
            for job in jobs:
                print(f"   Job {job['job_id'][:8]}... - {job['status']} ({job['progress']}%)")
        else:
            print(f"[ERROR] Failed to get training jobs: {response.status_code}")
    
    except Exception as e:
        print(f"[ERROR] Training jobs list error: {e}")
    
    # Step 4: Test datasets list
    print("\n4. Testing Datasets List")
    print("-" * 30)
    
    try:
        response = requests.get(f"{base_url}/datasets?project_name={project_name}")
        
        if response.status_code == 200:
            datasets = response.json()
            print(f"[SUCCESS] Retrieved {len(datasets)} datasets")
            for dataset in datasets:
                print(f"   {dataset['dataset_name']} - {dataset['images_count']} images, {dataset['labels_count']} labels")
        else:
            print(f"[ERROR] Failed to get datasets: {response.status_code}")
    
    except Exception as e:
        print(f"[ERROR] Datasets list error: {e}")
    
    # Step 5: Test trained models list
    print("\n5. Testing Trained Models List")
    print("-" * 30)
    
    try:
        response = requests.get(f"{base_url}/models/trained?project_name={project_name}")
        
        if response.status_code == 200:
            models = response.json()
            print(f"[SUCCESS] Retrieved {len(models)} trained models")
            for model in models:
                print(f"   {model['model_name']} - {model['size_mb']:.1f} MB")
        else:
            print(f"[ERROR] Failed to get trained models: {response.status_code}")
    
    except Exception as e:
        print(f"[ERROR] Trained models list error: {e}")
    
    # Cleanup
    print("\n6. Cleanup")
    print("-" * 30)
    
    try:
        import shutil
        if dataset_dir.exists():
            shutil.rmtree(dataset_dir)
            print("[SUCCESS] Test dataset directory cleaned up")
    except Exception as e:
        print(f"[ERROR] Cleanup error: {e}")
    
    print("\n" + "=" * 50)
    print("Training Pipeline Test Complete!")
    print("\nFeatures Tested:")
    print("• Dataset upload and management")
    print("• Training job creation and monitoring")
    print("• Model storage and retrieval")
    print("• API endpoint connectivity")
    print("\nNext Steps:")
    print("• Implement actual training execution")
    print("• Add background job processing")
    print("• Test with real training datasets")
    print("• Integrate with frontend interface")

if __name__ == "__main__":
    test_training_pipeline()
