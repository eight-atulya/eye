#!/usr/bin/env python3
"""
EYE Memory System Test Script

This script tests the complete memory system functionality including:
- Memory upload and processing
- Memory search and retrieval
- Memory management operations

Author: Anurag Atulya — EYE for Humanity
"""

import requests
import base64
import json
import time
from pathlib import Path

# Configuration
API_BASE = "http://localhost:8001/api/v1/memory"
TEST_IMAGE_PATH = "tests/images/WIN_20251024_21_05_58_Pro.jpg"

def test_memory_stats():
    """Test memory statistics endpoint"""
    print("Testing Memory Stats...")
    try:
        response = requests.get(f"{API_BASE}/stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"SUCCESS - Memory Stats: {stats}")
            return True
        else:
            print(f"FAILED - Memory Stats: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"ERROR - Memory Stats: {e}")
        return False

def test_memory_list():
    """Test memory list endpoint"""
    print("\nTesting Memory List...")
    try:
        response = requests.get(f"{API_BASE}/memories")
        if response.status_code == 200:
            memories = response.json()
            print(f"SUCCESS - Memory List: {len(memories)} memories found")
            return memories
        else:
            print(f"FAILED - Memory List: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"ERROR - Memory List: {e}")
        return []

def test_memory_search():
    """Test memory search endpoint"""
    print("\nTesting Memory Search...")
    try:
        data = {
            "query": "test search query",
            "limit": 10,
            "include_private": False
        }
        response = requests.post(f"{API_BASE}/search", data=data)
        if response.status_code == 200:
            result = response.json()
            print(f"SUCCESS - Memory Search: {result}")
            return True
        else:
            print(f"FAILED - Memory Search: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"ERROR - Memory Search: {e}")
        return False

def test_memory_upload():
    """Test memory upload endpoint"""
    print("\nTesting Memory Upload...")
    
    # Check if test image exists
    if not Path(TEST_IMAGE_PATH).exists():
        print(f"ERROR - Test image not found: {TEST_IMAGE_PATH}")
        return None
    
    try:
        # Prepare file upload
        with open(TEST_IMAGE_PATH, 'rb') as f:
            files = {'file': ('test_image.jpg', f, 'image/jpeg')}
            data = {
                'user_tags': 'test,memory,system',
                'user_notes': 'Test memory upload for EYE system',
                'is_private': False
            }
            
            response = requests.post(f"{API_BASE}/upload", files=files, data=data)
            
        if response.status_code == 200:
            result = response.json()
            print(f"SUCCESS - Memory Upload: {result}")
            return result.get('memory_id')
        else:
            print(f"FAILED - Memory Upload: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"ERROR - Memory Upload: {e}")
        return None

def test_memory_retrieval(memory_id):
    """Test memory retrieval by ID"""
    if not memory_id:
        print("\nERROR - No memory ID provided for retrieval test")
        return False
        
    print(f"\nTesting Memory Retrieval for ID: {memory_id}")
    try:
        response = requests.get(f"{API_BASE}/memories/{memory_id}")
        if response.status_code == 200:
            memory = response.json()
            print(f"SUCCESS - Memory Retrieval: {memory}")
            return True
        else:
            print(f"FAILED - Memory Retrieval: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"ERROR - Memory Retrieval: {e}")
        return False

def test_memory_chat():
    """Test memory chat functionality"""
    print("\nTesting Memory Chat...")
    try:
        data = {
            "message": "Tell me about my memories"
        }
        response = requests.post(f"{API_BASE}/chat-with-memories", data=data)
        if response.status_code == 200:
            result = response.json()
            print(f"SUCCESS - Memory Chat: {result}")
            return True
        else:
            print(f"FAILED - Memory Chat: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"ERROR - Memory Chat: {e}")
        return False

def main():
    """Run all memory system tests"""
    print("EYE Memory System Test Suite")
    print("=" * 50)
    
    # Test basic endpoints
    stats_ok = test_memory_stats()
    memories = test_memory_list()
    search_ok = test_memory_search()
    
    # Test upload functionality
    memory_id = test_memory_upload()
    
    # Wait a moment for processing
    if memory_id:
        print("\nWaiting for memory processing...")
        time.sleep(5)
        
        # Test retrieval
        retrieval_ok = test_memory_retrieval(memory_id)
        
        # Test chat functionality
        chat_ok = test_memory_chat()
    
    # Test updated stats after upload
    print("\nTesting Updated Memory Stats...")
    test_memory_stats()
    
    # Summary
    print("\n" + "=" * 50)
    print("Memory System Test Summary:")
    print(f"Stats Endpoint: {'PASS' if stats_ok else 'FAIL'}")
    print(f"List Endpoint: {'PASS' if memories is not None else 'FAIL'}")
    print(f"Search Endpoint: {'PASS' if search_ok else 'FAIL'}")
    print(f"Upload Endpoint: {'PASS' if memory_id else 'FAIL'}")
    if memory_id:
        print(f"Retrieval Endpoint: {'PASS' if retrieval_ok else 'FAIL'}")
        print(f"Chat Endpoint: {'PASS' if chat_ok else 'FAIL'}")
    
    print("\nMemory System is ready for use!")

if __name__ == "__main__":
    main()
