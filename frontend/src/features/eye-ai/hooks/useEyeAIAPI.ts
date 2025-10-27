'use client';

import { useState, useCallback } from 'react';

const API_BASE = 'http://localhost:8001/api/v1/ollama';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  stream?: boolean;
}

export interface GenerateRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface VisionChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | { type: 'text' | 'image_url'; text?: string; image_url?: { url: string } };
  }>;
  model?: string;
  temperature?: number;
}

export interface EyeAIResponse {
  message?: {
    content: string;
    role: string;
  };
  generated_text?: string;
  response?: string;
  error?: string;
}

export const useEyeAIAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = async (endpoint: string, data: any): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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

  const chat = async (request: ChatRequest): Promise<EyeAIResponse> => {
    return makeRequest('/chat', request);
  };

  const generate = async (request: GenerateRequest): Promise<EyeAIResponse> => {
    return makeRequest('/generate', request);
  };

  const visionChat = async (request: VisionChatRequest): Promise<EyeAIResponse> => {
    return makeRequest('/vision/chat', request);
  };

  const uploadImage = async (file: File, question?: string): Promise<EyeAIResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (question) {
        formData.append('question', question);
      }

      const response = await fetch(`${API_BASE}/vision/upload`, {
        method: 'POST',
        body: formData,
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

  const getModels = useCallback(async (): Promise<string[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/models`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.models?.map((model: any) => model.name) || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Checking health at:', `${API_BASE}/health`);
      const response = await fetch(`${API_BASE}/health`);
      console.log('Health check response:', response.status, response.ok);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }, []);

  return {
    chat,
    generate,
    visionChat,
    uploadImage,
    getModels,
    checkHealth,
    isLoading,
    error,
  };
};
