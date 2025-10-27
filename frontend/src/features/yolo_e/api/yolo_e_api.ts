/**
 * YOLO-E API Client
 * Handles all API calls for YOLO-E operations
 */

export interface YOLOEModelInfo {
  model_id: string;
  name: string;
  model_type: string;
  max_classes: number;
  few_shot_support: boolean;
  loaded_classes: number;
  device: string;
  confidence_threshold: number;
  iou_threshold: number;
  status: string;
}

export interface YOLOETrainingRequest {
  project_id: string;
  dataset_path: string;
  epochs?: number;
  learning_rate?: number;
  batch_size?: number;
  custom_classes?: string[];
  description?: string;
}

export interface YOLOEBatchProcessRequest {
  project_id: string;
  input_directory: string;
  output_directory: string;
  batch_size?: number;
  confidence_threshold?: number;
  iou_threshold?: number;
  save_annotations?: boolean;
  save_visualizations?: boolean;
}

export interface YOLOEDetectionResult {
  image_path: string;
  detections: Array<{
    class_id: number;
    class_name: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  processing_time: number;
  confidence_scores: number[];
  class_names: string[];
  bounding_boxes: number[][];
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress?: number;
  message?: string;
  results_path?: string;
  error?: string;
}

class YOLOEAPIClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || 
      (typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.hostname}:8001/api/v1/yolo-e`
        : 'http://localhost:8001/api/v1/yolo-e');
  }

  /**
   * Get YOLO-E model information
   */
  async getModelInfo(): Promise<YOLOEModelInfo> {
    const response = await fetch(`${this.baseURL}/models/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get model info: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  }

  /**
   * Load YOLO-E model
   */
  async loadModel(modelPath: string, configPath?: string): Promise<{ model_id: string; status: string }> {
    const formData = new FormData();
    formData.append('model_path', modelPath);
    if (configPath) {
      formData.append('config_path', configPath);
    }

    const response = await fetch(`${this.baseURL}/models/load`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to load model: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Start few-shot training
   */
  async startFewShotTraining(request: YOLOETrainingRequest): Promise<{ job_id: string; status: string }> {
    const response = await fetch(`${this.baseURL}/train/few-shot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to start training: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Start batch image processing
   */
  async startBatchProcessing(request: YOLOEBatchProcessRequest): Promise<{ job_id: string; status: string }> {
    const response = await fetch(`${this.baseURL}/process/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to start batch processing: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Perform single image inference
   */
  async inferSingleImage(
    file: File,
    confidenceThreshold: number = 0.5,
    iouThreshold: number = 0.45
  ): Promise<YOLOEDetectionResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('confidence_threshold', confidenceThreshold.toString());
    formData.append('iou_threshold', iouThreshold.toString());

    const response = await fetch(`${this.baseURL}/infer/single`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to perform inference: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await fetch(`${this.baseURL}/jobs/${jobId}/status`);
    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Poll job status until completion
   */
  async pollJobStatus(
    jobId: string,
    onProgress?: (status: JobStatus) => void,
    interval: number = 2000
  ): Promise<JobStatus> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getJobStatus(jobId);
          
          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed' || status.status === 'failed') {
            resolve(status);
          } else {
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

export const yoloEAPI = new YOLOEAPIClient();
export default yoloEAPI;
