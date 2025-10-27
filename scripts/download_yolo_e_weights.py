#!/usr/bin/env python3
"""
Download YOLO-E model weights using ultralytics package
"""

import os
import sys
from pathlib import Path

def download_yolo_e_models():
    """Download YOLO-E models using ultralytics package"""
    
    try:
        # Import ultralytics
        from ultralytics import YOLO
        
        # Define the storage directory
        storage_dir = Path("storage/weights/yolo_e/base")
        storage_dir.mkdir(parents=True, exist_ok=True)
        
        print("YOLO-E Model Weights Downloader")
        print("=" * 40)
        
        # YOLO-E model variants to download
        models = [
            "yoloe-11s.pt",
            "yoloe-11m.pt", 
            "yoloe-11l.pt",
            "yoloe-11x.pt"
        ]
        
        downloaded_count = 0
        
        for model_name in models:
            model_path = storage_dir / model_name
            
            # Check if model already exists
            if model_path.exists():
                print(f"✓ {model_name} already exists")
                continue
            
            try:
                print(f"Downloading {model_name}...")
                
                # Download model using ultralytics
                model = YOLO(model_name)
                
                # Save the model to our storage directory
                model.save(model_path)
                
                print(f"✓ {model_name} downloaded successfully")
                downloaded_count += 1
                
            except Exception as e:
                print(f"✗ Failed to download {model_name}: {e}")
                continue
        
        print(f"\nDownload Summary:")
        print(f"Successfully downloaded: {downloaded_count}/{len(models)} models")
        
        if downloaded_count > 0:
            print(f"Models saved to: {storage_dir}")
            print("\nYOLO-E models are now ready for use!")
            
        return downloaded_count > 0
        
    except ImportError:
        print("Error: ultralytics package not found.")
        print("Please install ultralytics: pip install ultralytics")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def download_alternative_models():
    """Download alternative YOLO models if YOLO-E is not available"""
    
    try:
        from ultralytics import YOLO
        
        storage_dir = Path("storage/weights/yolo_e/base")
        storage_dir.mkdir(parents=True, exist_ok=True)
        
        print("\nYOLO-E models not available. Downloading YOLO11 models as alternatives...")
        print("=" * 60)
        
        # Alternative YOLO models
        alternative_models = [
            "yolo11s.pt",
            "yolo11m.pt",
            "yolo11l.pt",
            "yolo11x.pt"
        ]
        
        downloaded_count = 0
        
        for model_name in alternative_models:
            model_path = storage_dir / model_name
            
            if model_path.exists():
                print(f"✓ {model_name} already exists")
                continue
            
            try:
                print(f"Downloading {model_name}...")
                
                model = YOLO(model_name)
                model.save(model_path)
                
                print(f"✓ {model_name} downloaded successfully")
                downloaded_count += 1
                
            except Exception as e:
                print(f"✗ Failed to download {model_name}: {e}")
                continue
        
        print(f"\nAlternative Download Summary:")
        print(f"Successfully downloaded: {downloaded_count}/{len(alternative_models)} models")
        
        if downloaded_count > 0:
            print(f"Models saved to: {storage_dir}")
            print("\nYOLO models are now ready for use!")
            
        return downloaded_count > 0
        
    except Exception as e:
        print(f"Error downloading alternative models: {e}")
        return False

def main():
    """Main function"""
    
    # Try to download YOLO-E models first
    success = download_yolo_e_models()
    
    # If YOLO-E models are not available, try alternative YOLO models
    if not success:
        success = download_alternative_models()
    
    if not success:
        print("\nFailed to download any models.")
        print("Please check your internet connection and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()