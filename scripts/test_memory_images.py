#!/usr/bin/env python3
"""
Memory Processing Test Script

This script manually triggers AI processing for existing memories to test the pipeline.
"""

import requests
import json

# Configuration
API_BASE = "http://localhost:8001/api/v1/memory"

def get_memories():
    """Get all memories"""
    try:
        response = requests.get(f"{API_BASE}/memories")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to get memories: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error getting memories: {e}")
        return []

def test_image_endpoint(image_uuid):
    """Test if image endpoint works"""
    try:
        response = requests.get(f"{API_BASE}/image/{image_uuid}")
        if response.status_code == 200:
            print(f"SUCCESS - Image endpoint working for {image_uuid}")
            return True
        else:
            print(f"FAILED - Image endpoint failed for {image_uuid}: {response.status_code}")
            return False
    except Exception as e:
        print(f"ERROR - Image endpoint error for {image_uuid}: {e}")
        return False

def main():
    """Test memory system"""
    print("Memory System Diagnostic Test")
    print("=" * 40)
    
    # Get memories
    memories = get_memories()
    print(f"Found {len(memories)} memories")
    
    if not memories:
        print("No memories found. Upload some images first.")
        return
    
    # Test each memory
    for memory in memories:
        print(f"\nTesting memory: {memory['id']}")
        print(f"  Image UUID: {memory['image_uuid']}")
        print(f"  AI Description: {memory.get('ai_description', 'None')}")
        print(f"  Processing Status: {memory.get('processing_status', 'Unknown')}")
        
        # Test image endpoint
        test_image_endpoint(memory['image_uuid'])
        
        # Show image URL
        print(f"  Image URL: {memory['image_url']}")
    
    print("\n" + "=" * 40)
    print("Diagnostic complete!")

if __name__ == "__main__":
    main()
