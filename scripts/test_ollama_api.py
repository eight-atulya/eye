"""
Test script for Ollama API endpoints
Tests all endpoints to verify end-to-end functionality
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:8001"
API_BASE = f"{BASE_URL}/api/v1/ollama"

def print_test(name):
    """Print test header"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"{'='*60}")

def test_health():
    """Test health endpoint"""
    print_test("Health Check")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_list_models():
    """Test list models endpoint"""
    print_test("List Models")
    try:
        response = requests.get(f"{API_BASE}/models", timeout=30)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Models found: {data.get('count', 0)}")
        if data.get('models'):
            for model in data['models']:
                print(f"  - {model.get('name', 'unknown')}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_chat():
    """Test chat endpoint"""
    print_test("Chat Endpoint")
    try:
        payload = {
            "messages": [
                {"role": "user", "content": "Hello! Can you introduce yourself?"}
            ]
        }
        response = requests.post(
            f"{API_BASE}/chat",
            json=payload,
            timeout=60
        )
        print(f"Status: {response.status_code}")
        data = response.json()
        if response.status_code == 200:
            content = data.get('message', {}).get('content', 'No content')
            print(f"Response preview: {content[:200]}...")
        else:
            print(f"Response: {json.dumps(data, indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_generate():
    """Test text generation endpoint"""
    print_test("Text Generation")
    try:
        payload = {
            "prompt": "Write a haiku about AI and machines.",
            "temperature": 0.7,
            "max_tokens": 100
        }
        response = requests.post(
            f"{API_BASE}/generate",
            json=payload,
            timeout=60
        )
        print(f"Status: {response.status_code}")
        data = response.json()
        if response.status_code == 200:
            text = data.get('generated_text', 'No text')
            print(f"Generated: {text[:200]}...")
        else:
            print(f"Response: {json.dumps(data, indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Run all tests"""
    print("="*60)
    print("Ollama API End-to-End Testing")
    print("="*60)
    
    results = []
    
    # Wait for backend to be ready
    print("\nWaiting for backend to be ready...")
    for i in range(30):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            if response.status_code == 200:
                print("Backend is ready!")
                break
        except:
            pass
        time.sleep(1)
        if i % 5 == 0:
            print(f"Still waiting... ({i}s)")
    
    # Run tests
    results.append(("Health Check", test_health()))
    time.sleep(1)
    
    results.append(("List Models", test_list_models()))
    time.sleep(1)
    
    results.append(("Chat", test_chat()))
    time.sleep(1)
    
    results.append(("Generate", test_generate()))
    
    # Print summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    passed = 0
    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{name}: {status}")
        if result:
            passed += 1
    
    print(f"\nTotal: {passed}/{len(results)} tests passed")
    
    return 0 if passed == len(results) else 1

if __name__ == "__main__":
    sys.exit(main())
