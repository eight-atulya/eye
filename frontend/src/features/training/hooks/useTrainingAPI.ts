'use client';

import { useState, useCallback } from 'react';

interface TrainingJob {
  job_id: string;
  project_name: string;
  status: string;
  progress: number;
  current_epoch: number;
  total_epochs: number;
  best_metrics?: Record<string, number>;
  model_path?: string;
  logs: string[];
  created_at: string;
  updated_at: string;
  error_message?: string;
}

interface Dataset {
  project_name: string;
  dataset_name: string;
  path: string;
  images_count: number;
  labels_count: number;
}

interface TrainedModel {
  project_name: string;
  model_name: string;
  model_path: string;
  size_mb: number;
  created_at: number;
}

export const useTrainingAPI = () => {
  const baseURL = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.hostname}:8001/api/v1/yolo-e`
    : 'http://localhost:8001/api/v1/yolo-e';

  const startTraining = useCallback(async (trainingConfig: {
    project_name: string;
    dataset_path: string;
    base_model: string;
    epochs: number;
    batch_size: number;
    learning_rate: number;
    image_size: number;
    patience: number;
    validation_split: number;
    custom_classes?: string[];
    description?: string;
  }): Promise<TrainingJob> => {
    try {
      const response = await fetch(`${baseURL}/training/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(trainingConfig),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Training API error:', error);
      throw new Error(`Training failed: ${error.message}`);
    }
  }, [baseURL]);

  const getTrainingJobs = useCallback(async (projectName?: string): Promise<TrainingJob[]> => {
    try {
      const url = projectName 
        ? `${baseURL}/training/jobs?project_name=${encodeURIComponent(projectName)}`
        : `${baseURL}/training/jobs`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Get training jobs error:', error);
      throw new Error(`Failed to get training jobs: ${error.message}`);
    }
  }, [baseURL]);

  const getTrainingJob = useCallback(async (jobId: string): Promise<TrainingJob> => {
    try {
      const response = await fetch(`${baseURL}/training/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Get training job error:', error);
      throw new Error(`Failed to get training job: ${error.message}`);
    }
  }, [baseURL]);

  const cancelTrainingJob = useCallback(async (jobId: string): Promise<{ status: string; job_id: string }> => {
    try {
      const response = await fetch(`${baseURL}/training/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Cancel training job error:', error);
      throw new Error(`Failed to cancel training job: ${error.message}`);
    }
  }, [baseURL]);

  const uploadDataset = useCallback(async (
    files: File[],
    projectName: string,
    datasetName: string,
    description: string = '',
    classes: string[] = []
  ): Promise<{
    status: string;
    project_name: string;
    dataset_name: string;
    uploaded_files: number;
    dataset_path: string;
    classes: string[];
  }> => {
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('project_name', projectName);
      formData.append('dataset_name', datasetName);
      formData.append('description', description);
      formData.append('classes', classes.join(','));

      const response = await fetch(`${baseURL}/datasets/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Dataset upload error:', error);
      throw new Error(`Dataset upload failed: ${error.message}`);
    }
  }, [baseURL]);

  const getDatasets = useCallback(async (projectName?: string): Promise<Dataset[]> => {
    try {
      const url = projectName 
        ? `${baseURL}/datasets?project_name=${encodeURIComponent(projectName)}`
        : `${baseURL}/datasets`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Get datasets error:', error);
      throw new Error(`Failed to get datasets: ${error.message}`);
    }
  }, [baseURL]);

  const getTrainedModels = useCallback(async (projectName?: string): Promise<TrainedModel[]> => {
    try {
      const url = projectName 
        ? `${baseURL}/models/trained?project_name=${encodeURIComponent(projectName)}`
        : `${baseURL}/models/trained`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Get trained models error:', error);
      throw new Error(`Failed to get trained models: ${error.message}`);
    }
  }, [baseURL]);

  const inferWithTrainedModel = useCallback(async (
    imageFile: File,
    modelPath: string,
    confidenceThreshold: number = 0.5,
    iouThreshold: number = 0.45,
    useGpu: boolean = true
  ): Promise<{
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
  }> => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('model_path', modelPath);
      formData.append('confidence_threshold', confidenceThreshold.toString());
      formData.append('iou_threshold', iouThreshold.toString());
      formData.append('use_gpu', useGpu.toString());

      const response = await fetch(`${baseURL}/infer/trained`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Trained model inference error:', error);
      throw new Error(`Inference failed: ${error.message}`);
    }
  }, [baseURL]);

  return {
    startTraining,
    getTrainingJobs,
    getTrainingJob,
    cancelTrainingJob,
    uploadDataset,
    getDatasets,
    getTrainedModels,
    inferWithTrainedModel,
  };
};
