'use client';

/**
 * YOLO-E Hooks
 * React hooks for YOLO-E operations
 */

import { useState, useCallback } from 'react';
import { yoloEAPI, YOLOEModelInfo, YOLOETrainingRequest, YOLOEBatchProcessRequest, YOLOEDetectionResult, JobStatus } from '../api/yolo_e_api';

export const useYOLOEModel = () => {
  const [modelInfo, setModelInfo] = useState<YOLOEModelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModelInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await yoloEAPI.getModelInfo();
      setModelInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model info');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadModel = useCallback(async (modelPath: string, configPath?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await yoloEAPI.loadModel(modelPath, configPath);
      await loadModelInfo(); // Refresh model info after loading
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadModelInfo]);

  return {
    modelInfo,
    loading,
    error,
    loadModelInfo,
    loadModel,
  };
};

export const useYOLOETraining = () => {
  const [training, setTraining] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTraining = useCallback(async (request: YOLOETrainingRequest) => {
    setTraining(true);
    setError(null);
    setProgress(null);
    
    try {
      const result = await yoloEAPI.startFewShotTraining(request);
      setJobId(result.job_id);
      
      // Start polling for progress
      const finalStatus = await yoloEAPI.pollJobStatus(
        result.job_id,
        (status) => setProgress(status)
      );
      
      setProgress(finalStatus);
      return finalStatus;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
      throw err;
    } finally {
      setTraining(false);
    }
  }, []);

  const checkProgress = useCallback(async (jobId: string) => {
    try {
      const status = await yoloEAPI.getJobStatus(jobId);
      setProgress(status);
      return status;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check progress');
      throw err;
    }
  }, []);

  return {
    training,
    jobId,
    progress,
    error,
    startTraining,
    checkProgress,
  };
};

export const useYOLOEBatchProcessing = () => {
  const [processing, setProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startBatchProcessing = useCallback(async (request: YOLOEBatchProcessRequest) => {
    setProcessing(true);
    setError(null);
    setProgress(null);
    
    try {
      const result = await yoloEAPI.startBatchProcessing(request);
      setJobId(result.job_id);
      
      // Start polling for progress
      const finalStatus = await yoloEAPI.pollJobStatus(
        result.job_id,
        (status) => setProgress(status)
      );
      
      setProgress(finalStatus);
      return finalStatus;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch processing failed');
      throw err;
    } finally {
      setProcessing(false);
    }
  }, []);

  const checkProgress = useCallback(async (jobId: string) => {
    try {
      const status = await yoloEAPI.getJobStatus(jobId);
      setProgress(status);
      return status;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check progress');
      throw err;
    }
  }, []);

  return {
    processing,
    jobId,
    progress,
    error,
    startBatchProcessing,
    checkProgress,
  };
};

export const useYOLOEInference = () => {
  const [inferring, setInferring] = useState(false);
  const [result, setResult] = useState<YOLOEDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inferImage = useCallback(async (
    file: File,
    confidenceThreshold: number = 0.5,
    iouThreshold: number = 0.45
  ) => {
    setInferring(true);
    setError(null);
    setResult(null);
    
    try {
      const detectionResult = await yoloEAPI.inferSingleImage(file, confidenceThreshold, iouThreshold);
      setResult(detectionResult);
      return detectionResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inference failed');
      throw err;
    } finally {
      setInferring(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    inferring,
    result,
    error,
    inferImage,
    clearResult,
  };
};
