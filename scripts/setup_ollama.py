"""
Setup script for Ollama - Pull default model (gemma3:12b)
This script ensures the default model is available when the system starts
"""

import requests
import time
import sys
import os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = "gemma3:12b"


def check_ollama_health():
    """Check if Ollama is running and healthy"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        return response.status_code == 200
    except Exception as e:
        print(f"Ollama health check failed: {e}")
        return False


def wait_for_ollama(max_wait=300):
    """Wait for Ollama to be ready"""
    print("Waiting for Ollama service to be ready...")
    for i in range(max_wait):
        if check_ollama_health():
            print("[OK] Ollama is ready!")
            return True
        time.sleep(1)
        if i % 10 == 0:
            print(f"Still waiting... ({i}s)")
    
    print(f"Timeout waiting for Ollama after {max_wait}s")
    return False


def list_models():
    """List all available models"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags")
        if response.status_code == 200:
            data = response.json()
            return [m.get("name") for m in data.get("models", [])]
        return []
    except Exception as e:
        print(f"Failed to list models: {e}")
        return []


def pull_model(model_name):
    """Pull a model from Ollama"""
    print(f"Pulling model: {model_name}")
    
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/pull",
            json={"name": model_name},
            stream=True,
            timeout=600
        )
        
        if response.status_code == 200:
            for line in response.iter_lines():
                if line:
                    try:
                        import json
                        data = json.loads(line)
                        if "status" in data:
                            print(f"  {data['status']}")
                        if "completed" in data:
                            print(f"  {data['completed']} / {data.get('total', '?')}")
                    except:
                        pass
            
            print(f"[OK] Model {model_name} pulled successfully")
            return True
        else:
            print(f"Failed to pull model: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error pulling model: {e}")
        return False


def main():
    """Main setup function"""
    print("=" * 60)
    print("Ollama Setup Script")
    print("=" * 60)
    
    # Wait for Ollama to be ready
    if not wait_for_ollama():
        print("ERROR: Ollama service is not available")
        sys.exit(1)
    
    # Check if model is already available
    models = list_models()
    print(f"\nAvailable models: {models}")
    
    if DEFAULT_MODEL in models:
        print(f"[OK] Model {DEFAULT_MODEL} is already available")
        return 0
    
    # Pull the default model
    print(f"\nModel {DEFAULT_MODEL} not found. Pulling now...")
    success = pull_model(DEFAULT_MODEL)
    
    if success:
        print("\n[OK] Setup complete!")
        return 0
    else:
        print("\n[FAILED] Setup failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
