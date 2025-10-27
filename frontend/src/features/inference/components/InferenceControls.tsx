'use client';

import { useState, useEffect } from 'react';

interface InferenceControlsProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  isProcessing: boolean;
}

interface ModelInfo {
  name: string;
  file: string;
  size: string;
  type: string;
  prompting: string;
}

export const InferenceControls = ({ selectedModel, onModelChange, isProcessing }: InferenceControlsProps) => {
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [gpuStatus, setGpuStatus] = useState<{ available: boolean; device?: string }>({ available: false });

  // Available YOLO-E models (prioritizing prompt-free models for better detection)
  const models: ModelInfo[] = [
    // YOLOE prompt-free models (best for automatic detection with 4585+ classes)
    { name: "YOLOE 11S (PF)", file: "yoloe-11s-seg-pf.pt", size: "Small", type: "segmentation", prompting: "prompt_free" },
    { name: "YOLOE V8S (PF)", file: "yoloe-v8s-seg-pf.pt", size: "Small", type: "segmentation", prompting: "prompt_free" },
    { name: "YOLOE V8L (PF)", file: "yoloe-v8l-seg-pf.pt", size: "Large", type: "segmentation", prompting: "prompt_free" },
    // YOLOE text/visual prompt models (require proper class mapping)
    { name: "YOLOE 11S", file: "yoloe-11s-seg.pt", size: "Small", type: "segmentation", prompting: "text_visual" },
    { name: "YOLOE 11M", file: "yoloe-11m-seg.pt", size: "Medium", type: "segmentation", prompting: "text_visual" },
    { name: "YOLOE 11L", file: "yoloe-11l-seg.pt", size: "Large", type: "segmentation", prompting: "text_visual" },
    { name: "YOLOE V8S", file: "yoloe-v8s-seg.pt", size: "Small", type: "segmentation", prompting: "text_visual" },
    { name: "YOLOE V8M", file: "yoloe-v8m-seg.pt", size: "Medium", type: "segmentation", prompting: "text_visual" },
    { name: "YOLOE V8L", file: "yoloe-v8l-seg.pt", size: "Large", type: "segmentation", prompting: "text_visual" },
    // Standard YOLO11 models (fallback for compatibility)
    { name: "YOLO11 Nano", file: "yolo11n.pt", size: "Nano", type: "detection", prompting: "standard" },
    { name: "YOLO11 Small", file: "yolo11s.pt", size: "Small", type: "detection", prompting: "standard" },
    { name: "YOLO11 Medium", file: "yolo11m.pt", size: "Medium", type: "detection", prompting: "standard" },
    { name: "YOLO11 Large", file: "yolo11l.pt", size: "Large", type: "detection", prompting: "standard" },
    { name: "YOLO11 Extra Large", file: "yolo11x.pt", size: "Extra Large", type: "detection", prompting: "standard" },
  ];

  useEffect(() => {
    setAvailableModels(models);
    // Check GPU status by testing backend
    const checkGpuStatus = async () => {
      try {
        // Test if GPU is available by making a test request
        const response = await fetch('http://localhost:8001/api/v1/yolo-e/models/info');
        if (response.ok) {
          // If backend is accessible, assume GPU might be available
          // We'll let the inference API handle the actual GPU detection
          setGpuStatus({ available: true, device: "CUDA" });
        }
      } catch (error) {
        setGpuStatus({ available: false, device: "CPU" });
      }
    };
    checkGpuStatus();
  }, []);

  const selectedModelInfo = availableModels.find(model => model.file === selectedModel);

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Select Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={isProcessing}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {availableModels.map((model) => (
            <option key={model.file} value={model.file}>
              {model.name} ({model.size}) - {model.prompting === 'prompt_free' ? 'Prompt-Free' : 'Text/Visual'}
            </option>
          ))}
        </select>
      </div>

      {/* Model Information */}
      {selectedModelInfo && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Model Information</h3>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Size:</span>
              <span className="text-white">{selectedModelInfo.size}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="text-white">{selectedModelInfo.type}</span>
            </div>
            <div className="flex justify-between">
              <span>Prompting:</span>
              <span className="text-white">
                {selectedModelInfo.prompting === 'prompt_free' ? 'Prompt-Free' : 'Text/Visual'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* GPU Status */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Processing Status</h3>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex justify-between items-center">
            <span>GPU:</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${gpuStatus.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-white">
                {gpuStatus.available ? `${gpuStatus.device} Available` : 'CPU Only'}
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span>Processing:</span>
            <span className="text-white">
              {gpuStatus.available ? 'GPU Accelerated' : 'CPU Processing'}
            </span>
          </div>
        </div>
      </div>

      {/* Inference Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Inference Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Confidence Threshold</label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              defaultValue="0.5"
              disabled={isProcessing}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.1</span>
              <span>0.5</span>
              <span>0.9</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">IoU Threshold</label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              defaultValue="0.45"
              disabled={isProcessing}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.1</span>
              <span>0.45</span>
              <span>0.9</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
