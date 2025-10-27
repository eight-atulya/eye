#!/usr/bin/env python3
"""
YOLOE Detection Test Script
Tests detection with multiple images using the working prompt-free YOLOE model
"""

import requests
import json
import time
from pathlib import Path
import os

def test_multiple_images():
    """Test YOLOE detection with multiple images"""
    
    base_url = "http://localhost:8001/api/v1/yolo-e"
    
    print("YOLOE Multi-Image Detection Test")
    print("=" * 50)
    
    # Test images directory
    test_images_dir = Path(".")
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
    
    # Find all test images
    test_images = []
    for ext in image_extensions:
        test_images.extend(test_images_dir.glob(f"*{ext}"))
        test_images.extend(test_images_dir.glob(f"*{ext.upper()}"))
    
    if not test_images:
        print("No test images found in current directory")
        return
    
    print(f"Found {len(test_images)} test images")
    
    # Test with prompt-free YOLOE model (working model)
    model_path = "yoloe-11s-seg-pf.pt"
    
    for i, image_path in enumerate(test_images[:5]):  # Test first 5 images
        print(f"\n{i+1}. Testing: {image_path.name}")
        
        try:
            with open(image_path, 'rb') as f:
                files = {'file': (image_path.name, f, 'image/jpeg')}
                data = {
                    'model_path': model_path,
                    'confidence_threshold': '0.01',
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
                    print(f"   SUCCESS: {len(result['detections'])} detections")
                    print(f"   Processing time: {result['processing_time']:.2f}s")
                    
                    if result['detections']:
                        print("   Detected objects:")
                        for j, detection in enumerate(result['detections'][:5]):  # Show first 5
                            print(f"     {j+1}. {detection['class_name']} ({detection['confidence']:.2f})")
                        if len(result['detections']) > 5:
                            print(f"     ... and {len(result['detections']) - 5} more")
                    else:
                        print("   No objects detected")
                else:
                    print(f"   FAILED: {response.status_code}")
                    print(f"   Error: {response.text}")
        except Exception as e:
            print(f"   ERROR: {e}")
    
    print("\n" + "=" * 50)
    print("Multi-Image Detection Test Complete!")
    print(f"\nModel Used: {model_path}")
    print("Features Demonstrated:")
    print("• Prompt-free YOLOE with 4585+ classes")
    print("• Automatic object detection")
    print("• GPU acceleration")
    print("• Real-time inference")

if __name__ == "__main__":
    test_multiple_images()
