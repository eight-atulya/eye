'use client';

import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:8001/api/v1/memory';
const BACKEND_BASE = 'http://localhost:8001';

export interface MemoryRecord {
  id: string;
  image_uuid: string;
  image_url: string;
  ai_description?: string;
  detected_objects?: string[];
  scene_context?: string;
  emotional_context?: string;
  user_tags?: string[];
  user_notes?: string;
  created_at: string;
  similarity_score?: number;
}

export interface MemoryUploadRequest {
  file: File;
  user_tags?: string[];
  user_notes?: string;
  is_private?: boolean;
}

export interface MemorySearchRequest {
  query: string;
  limit?: number;
  include_private?: boolean;
  filter_tags?: string[];
}

export const useMemoryAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to resolve image URLs
  const resolveImageUrl = useCallback((imageUrl: string): string => {
    if (imageUrl.startsWith('http')) {
      return imageUrl; // Already absolute URL
    }
    return `${BACKEND_BASE}${imageUrl}`; // Prepend backend base URL
  }, []);

  const makeRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadMemory = useCallback(async (request: MemoryUploadRequest): Promise<string> => {
    const formData = new FormData();
    formData.append('file', request.file);
    
    if (request.user_tags?.length) {
      formData.append('user_tags', request.user_tags.join(','));
    }
    
    if (request.user_notes) {
      formData.append('user_notes', request.user_notes);
    }
    
    formData.append('is_private', String(request.is_private || false));

    const response = await makeRequest('/upload', {
      method: 'POST',
      body: formData,
    });

    return response.memory_id;
  }, []);

  const searchMemories = useCallback(async (request: MemorySearchRequest): Promise<MemoryRecord[]> => {
    const formData = new FormData();
    formData.append('query', request.query);
    formData.append('limit', String(request.limit || 10));
    formData.append('include_private', String(request.include_private || false));
    
    if (request.filter_tags?.length) {
      formData.append('filter_tags', request.filter_tags.join(','));
    }

    const response = await makeRequest('/search', {
      method: 'POST',
      body: formData,
    });

    // Resolve image URLs
    return response.memories.map((memory: MemoryRecord) => ({
      ...memory,
      image_url: resolveImageUrl(memory.image_url)
    }));
  }, [resolveImageUrl]);

  const getUserMemories = useCallback(async (limit: number = 50, offset: number = 0): Promise<MemoryRecord[]> => {
    const response = await makeRequest(`/memories?limit=${limit}&offset=${offset}`);
    // Resolve image URLs
    return response.map((memory: MemoryRecord) => ({
      ...memory,
      image_url: resolveImageUrl(memory.image_url)
    }));
  }, [resolveImageUrl]);

  const getMemoryById = useCallback(async (memoryId: string): Promise<MemoryRecord> => {
    const response = await makeRequest(`/memories/${memoryId}`);
    // Resolve image URL
    return {
      ...response,
      image_url: resolveImageUrl(response.image_url)
    };
  }, [resolveImageUrl]);

  const deleteMemory = useCallback(async (memoryId: string): Promise<void> => {
    await makeRequest(`/memories/${memoryId}`, {
      method: 'DELETE',
    });
  }, []);

  const getMemoryStats = useCallback(async () => {
    const response = await makeRequest('/stats');
    return response;
  }, []);

  const chatWithMemories = useCallback(async (message: string) => {
    const formData = new FormData();
    formData.append('message', message);

    const response = await makeRequest('/chat-with-memories', {
      method: 'POST',
      body: formData,
    });

    // Resolve image URLs in relevant memories
    if (response.relevant_memories) {
      response.relevant_memories = response.relevant_memories.map((memory: any) => ({
        ...memory,
        image_url: resolveImageUrl(memory.image_url)
      }));
    }

    return response;
  }, [resolveImageUrl]);

  return {
    uploadMemory,
    searchMemories,
    getUserMemories,
    getMemoryById,
    deleteMemory,
    getMemoryStats,
    chatWithMemories,
    isLoading,
    error,
  };
};
