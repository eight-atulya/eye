'use client';

import { useCallback } from 'react';

interface InferenceAPIResponse {
  image_path: string;
  detections: Array<{
    class_id?: number;
    class_name: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  processing_time: number;
  confidence_scores: number[];
  class_names: string[];
  bounding_boxes: number[][];
}

export const useInferenceAPI = () => {
  const performInference = useCallback(async (
    imageFile: File, 
    modelPath: string, 
    useGpu: boolean = false,
    customClasses: string = "",
    promptMode: string = "internal"
  ): Promise<InferenceAPIResponse> => {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('model_path', modelPath);
    formData.append('use_gpu', useGpu.toString());
    formData.append('confidence_threshold', '0.5');
    formData.append('iou_threshold', '0.45');
    formData.append('custom_classes', customClasses);
    formData.append('prompt_mode', promptMode);

    try {
      const response = await fetch('http://localhost:8001/api/v1/yolo-e/infer/single', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Inference API error:', error);
      throw new Error(`Inference failed: ${error.message}`);
    }
  }, []);

  const loadModel = useCallback(async (modelPath: string): Promise<any> => {
    try {
      const response = await fetch('http://localhost:8001/api/v1/yolo-e/models/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_path: modelPath,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Model loading error:', error);
      throw new Error(`Model loading failed: ${error.message}`);
    }
  }, []);

  const getModelInfo = useCallback(async (): Promise<any> => {
    try {
      const response = await fetch('http://localhost:8001/api/v1/yolo-e/models/info', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Model info error:', error);
      throw new Error(`Failed to get model info: ${error.message}`);
    }
  }, []);

  const getBaseClasses = useCallback(async (): Promise<string[]> => {
    try {
      const response = await fetch('http://localhost:8001/api/v1/yolo-e/classes/base', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.classes || [];
    } catch (error: any) {
      console.error('Base classes error:', error);
      throw new Error(`Failed to get base classes: ${error.message}`);
    }
  }, []);

  return {
    performInference,
    loadModel,
    getModelInfo,
    getBaseClasses,
  };
};
