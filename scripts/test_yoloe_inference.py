#!/usr/bin/env python3
"""
YOLOE Inference Test Script
Demonstrates different inference modes and class selection capabilities
"""

import requests
import json
import time
from pathlib import Path

def test_yoloe_inference():
    """Test YOLOE inference with different modes"""
    
    base_url = "http://localhost:8001/api/v1/yolo-e"
    
    print("YOLOE Inference Test Suite")
    print("=" * 50)
    
    # Test 1: Get base classes
    print("\n1. Testing Base Classes Endpoint...")
    try:
        response = requests.get(f"{base_url}/classes/base")
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: Base classes loaded: {data['total_classes']} classes")
            print(f"   Description: {data['description']}")
            print(f"   Sample classes: {data['classes'][:10]}")
        else:
            print(f"FAILED: Failed to get base classes: {response.status_code}")
    except Exception as e:
        print(f"ERROR: Error getting base classes: {e}")
    
    # Test 2: Internal mode inference (no custom classes)
    print("\n2. Testing Internal Mode Inference...")
    test_image_path = "objects_test.jpg"
    
    if not Path(test_image_path).exists():
        print(f"ERROR: Test image not found: {test_image_path}")
        return
    
    try:
        with open(test_image_path, 'rb') as f:
            files = {'file': (test_image_path, f, 'image/jpeg')}
            data = {
                'model_path': 'yoloe-11s-seg.pt',
                'confidence_threshold': '0.1',
                'iou_threshold': '0.45',
                'use_gpu': 'true',
                'custom_classes': '',
                'prompt_mode': 'internal'
            }
            
            start_time = time.time()
            response = requests.post(f"{base_url}/infer/single", files=files, data=data)
            end_time = time.time()
            
            if response.status_code == 200:
                result = response.json()
                print(f"SUCCESS: Internal mode inference successful!")
                print(f"   Processing time: {result['processing_time']:.2f}s")
                print(f"   Detections: {len(result['detections'])}")
                print(f"   Classes found: {result['class_names']}")
                
                if result['detections']:
                    print("   Sample detections:")
                    for i, detection in enumerate(result['detections'][:3]):
                        print(f"     {i+1}. {detection['class_name']} ({detection['confidence']:.2f})")
                else:
                    print("   No objects detected (try lowering confidence threshold)")
            else:
                print(f"FAILED: Internal mode inference failed: {response.status_code}")
                print(f"   Error: {response.text}")
    except Exception as e:
        print(f"ERROR: Error in internal mode inference: {e}")
    
    # Test 3: Text prompt mode (if supported)
    print("\n3. Testing Text Prompt Mode...")
    try:
        with open(test_image_path, 'rb') as f:
            files = {'file': (test_image_path, f, 'image/jpeg')}
            data = {
                'model_path': 'yoloe-11s-seg.pt',
                'confidence_threshold': '0.1',
                'iou_threshold': '0.45',
                'use_gpu': 'true',
                'custom_classes': 'person,car,dog,cat',
                'prompt_mode': 'text'
            }
            
            start_time = time.time()
            response = requests.post(f"{base_url}/infer/single", files=files, data=data)
            end_time = time.time()
            
            if response.status_code == 200:
                result = response.json()
                print(f"SUCCESS: Text prompt mode inference successful!")
                print(f"   Processing time: {result['processing_time']:.2f}s")
                print(f"   Detections: {len(result['detections'])}")
                print(f"   Classes found: {result['class_names']}")
                
                if result['detections']:
                    print("   Sample detections:")
                    for i, detection in enumerate(result['detections'][:3]):
                        print(f"     {i+1}. {detection['class_name']} ({detection['confidence']:.2f})")
                else:
                    print("   No objects detected with custom classes")
            else:
                print(f"FAILED: Text prompt mode inference failed: {response.status_code}")
                print(f"   Error: {response.text}")
    except Exception as e:
        print(f"ERROR: Error in text prompt mode inference: {e}")
    
    # Test 4: Model info
    print("\n4. Testing Model Info Endpoint...")
    try:
        response = requests.get(f"{base_url}/models/info")
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: Model info retrieved successfully!")
            print(f"   Model ID: {data['model_id']}")
            print(f"   Name: {data['name']}")
            print(f"   Type: {data['model_type']}")
            print(f"   Max classes: {data['max_classes']}")
            print(f"   Device: {data['device']}")
            print(f"   Status: {data['status']}")
        else:
            print(f"FAILED: Failed to get model info: {response.status_code}")
    except Exception as e:
        print(f"ERROR: Error getting model info: {e}")
    
    print("\n" + "=" * 50)
    print("YOLOE Inference Test Complete!")
    print("\nKey Features Demonstrated:")
    print("• Internal vocabulary mode (1200+ base classes)")
    print("• Text prompt mode (custom class selection)")
    print("• Base classes API endpoint")
    print("• Model information retrieval")
    print("• GPU acceleration support")
    print("• Real-time inference with YOLOE models")

if __name__ == "__main__":
    test_yoloe_inference()
