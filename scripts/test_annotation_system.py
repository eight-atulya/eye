#!/usr/bin/env python3
"""
Test script for the annotation system
Tests project creation, task creation, and annotation management
"""

import requests
import json
import os
from pathlib import Path

BASE_URL = "http://localhost:8001/api/v1/annotations"

def test_annotation_system():
    """Test the complete annotation system workflow"""
    
    print("=== Testing EYE Annotation System ===")
    
    # Test 1: Create a project
    print("\n1. Creating annotation project...")
    project_data = {
        "project_name": "Test Annotation Project",
        "description": "Test project for annotation system",
        "labels": [
            {"id": "1", "name": "person", "color": "#FF0000", "category": "object"},
            {"id": "2", "name": "car", "color": "#00FF00", "category": "object"},
            {"id": "3", "name": "bicycle", "color": "#0000FF", "category": "object"}
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/projects/json", json=project_data)
        if response.status_code == 200:
            project_result = response.json()
            print(f"[SUCCESS] Project created: {project_result['project']['name']}")
            project_id = project_result['project']['id']
        else:
            print(f"[ERROR] Failed to create project: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"[ERROR] Exception creating project: {e}")
        return
    
    # Test 2: List projects
    print("\n2. Listing projects...")
    try:
        response = requests.get(f"{BASE_URL}/projects")
        if response.status_code == 200:
            projects_result = response.json()
            print(f"[SUCCESS] Found {projects_result['count']} projects")
            for project in projects_result['projects']:
                print(f"  - {project['name']} ({project['id']})")
        else:
            print(f"[ERROR] Failed to list projects: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Exception listing projects: {e}")
    
    # Test 3: Get project details
    print("\n3. Getting project details...")
    try:
        response = requests.get(f"{BASE_URL}/projects/{project_id}")
        if response.status_code == 200:
            project_details = response.json()
            print(f"[SUCCESS] Project details retrieved")
            print(f"  Name: {project_details['project']['name']}")
            print(f"  Labels: {len(project_details['project']['labels'])}")
        else:
            print(f"[ERROR] Failed to get project details: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Exception getting project details: {e}")
    
    # Test 4: Use existing image file
    print("\n4. Using existing image file...")
    test_image_path = Path("objects_test.jpg")
    
    if not test_image_path.exists():
        print(f"[ERROR] Test image not found: {test_image_path}")
        print("Please ensure objects_test.jpg exists in the current directory")
        return
    
    print(f"[SUCCESS] Using test image: {test_image_path}")
    
    # Test 5: Create annotation task
    print("\n5. Creating annotation task...")
    try:
        with open(test_image_path, 'rb') as f:
            files = {'file': ('test_image.jpg', f, 'image/jpeg')}
            task_data = {
                'project_id': project_id,
                'task_name': 'Test Annotation Task',
                'description': 'Test task for annotation system'
            }
            
            response = requests.post(f"{BASE_URL}/tasks", data=task_data, files=files)
            
        if response.status_code == 200:
            task_result = response.json()
            print(f"[SUCCESS] Task created: {task_result['task']['name']}")
            print(f"  Uploaded images: {task_result['uploaded_images']}")
            task_id = task_result['task']['id']
        else:
            print(f"[ERROR] Failed to create task: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"[ERROR] Exception creating task: {e}")
        return
    finally:
        # No cleanup needed for existing file
        print(f"[INFO] Using existing test image: {test_image_path}")
    
    # Test 6: List tasks
    print("\n6. Listing tasks...")
    try:
        response = requests.get(f"{BASE_URL}/tasks?project_id={project_id}")
        if response.status_code == 200:
            tasks_result = response.json()
            print(f"[SUCCESS] Found {tasks_result['count']} tasks")
            for task in tasks_result['tasks']:
                print(f"  - {task['name']} ({task['id']}) - {len(task['images'])} images")
        else:
            print(f"[ERROR] Failed to list tasks: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Exception listing tasks: {e}")
    
    # Test 7: Get task details
    print("\n7. Getting task details...")
    try:
        response = requests.get(f"{BASE_URL}/tasks/{task_id}")
        if response.status_code == 200:
            task_details = response.json()
            print(f"[SUCCESS] Task details retrieved")
            print(f"  Name: {task_details['task']['name']}")
            print(f"  Images: {len(task_details['task']['images'])}")
            print(f"  Annotations: {len(task_details['task']['annotations'])}")
        else:
            print(f"[ERROR] Failed to get task details: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Exception getting task details: {e}")
    
    # Test 8: Save annotations
    print("\n8. Saving test annotations...")
    test_annotations = [
        {
            "id": "1",
            "labelId": "1",
            "type": "bbox",
            "coordinates": [
                {"x": 100, "y": 100},
                {"x": 200, "y": 200}
            ],
            "confidence": 0.95,
            "attributes": {}
        },
        {
            "id": "2", 
            "labelId": "2",
            "type": "polygon",
            "coordinates": [
                {"x": 300, "y": 300},
                {"x": 400, "y": 300},
                {"x": 400, "y": 400},
                {"x": 300, "y": 400}
            ],
            "confidence": 0.87,
            "attributes": {}
        }
    ]
    
    try:
        annotation_data = {
            'image_filename': 'test_image.jpg',
            'annotations_json': json.dumps(test_annotations)
        }
        
        response = requests.post(f"{BASE_URL}/tasks/{task_id}/annotations", data=annotation_data)
        
        if response.status_code == 200:
            annotation_result = response.json()
            print(f"[SUCCESS] Annotations saved")
            print(f"  Annotation count: {annotation_result['annotation_count']}")
        else:
            print(f"[ERROR] Failed to save annotations: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[ERROR] Exception saving annotations: {e}")
    
    # Test 9: Export annotations (COCO format)
    print("\n9. Exporting annotations (COCO format)...")
    try:
        export_data = {
            'export_format': 'coco',
            'include_images': False
        }
        
        response = requests.post(f"{BASE_URL}/tasks/{task_id}/export", data=export_data)
        
        if response.status_code == 200:
            export_result = response.json()
            print(f"[SUCCESS] Annotations exported")
            print(f"  Format: {export_result['format']}")
            print(f"  Export file: {export_result['export_file']}")
        else:
            print(f"[ERROR] Failed to export annotations: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[ERROR] Exception exporting annotations: {e}")
    
    # Test 10: Pre-label with YOLO-E
    print("\n10. Testing pre-labeling with YOLO-E...")
    try:
        prelabel_data = {
            'model_name': 'yoloe-11s-seg-pf.pt',
            'confidence_threshold': 0.5,
            'use_gpu': False
        }
        
        response = requests.post(f"{BASE_URL}/tasks/{task_id}/pre-label", data=prelabel_data)
        
        if response.status_code == 200:
            prelabel_result = response.json()
            print(f"[SUCCESS] Pre-labeling completed")
            print(f"  Pre-labeled images: {prelabel_result['pre_labeled_images']}")
            print(f"  Total images: {prelabel_result['total_images']}")
        else:
            print(f"[ERROR] Failed to pre-label: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[ERROR] Exception pre-labeling: {e}")
    
    print("\n=== Annotation System Test Complete ===")
    print(f"Project ID: {project_id}")
    print(f"Task ID: {task_id}")
    print("You can now test the frontend at: http://localhost:3003/annotation")

if __name__ == "__main__":
    test_annotation_system()
