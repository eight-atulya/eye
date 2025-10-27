'use client';

import { useState } from 'react';
import { useInferenceAPI } from '../hooks/useInferenceAPI';

interface InferenceResultsProps {
  uploadedImage: File | null;
  inferenceResults: any;
  isProcessing: boolean;
  onProcessingStart: () => void;
  onProcessingComplete: (results: any) => void;
  onProcessingError: (error: string) => void;
  selectedModel: string;
  selectedClasses: string[];
  promptMode: string;
}

export const InferenceResults = ({
  uploadedImage,
  inferenceResults,
  isProcessing,
  onProcessingStart,
  onProcessingComplete,
  onProcessingError,
  selectedModel,
  selectedClasses,
  promptMode
}: InferenceResultsProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { performInference } = useInferenceAPI();

  // Handle image preview
  if (uploadedImage && !imagePreview) {
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(uploadedImage);
  }

  const handleStartInference = async () => {
    if (!uploadedImage) return;

    try {
      onProcessingStart();
      
      // Perform inference using the API (try GPU first, fallback to CPU)
      let results;
      try {
        results = await performInference(uploadedImage, selectedModel, true, selectedClasses.join(','), promptMode);
      } catch (gpuError) {
        console.log('GPU inference failed, falling back to CPU:', gpuError.message);
        results = await performInference(uploadedImage, selectedModel, false, selectedClasses.join(','), promptMode);
      }
      onProcessingComplete(results);
    } catch (error: any) {
      onProcessingError(error.message || 'Inference failed');
    }
  };

  const renderImagePreview = () => {
    if (!imagePreview) return null;

    return (
      <div className="relative">
        <img
          src={imagePreview}
          alt="Uploaded image"
          className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-700"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm">Processing...</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInferenceResults = () => {
    if (!inferenceResults) return null;

    return (
      <div className="space-y-4">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Inference Results</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-400">Completed</span>
          </div>
        </div>

        {/* Detection Summary */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">Detection Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Objects Detected:</span>
              <span className="text-white">{inferenceResults.detections?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Processing Time:</span>
              <span className="text-white">{inferenceResults.processing_time || 'N/A'}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Model:</span>
              <span className="text-white">{selectedModel}</span>
            </div>
          </div>
        </div>

        {/* Detections List */}
        {inferenceResults.detections && inferenceResults.detections.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">Detected Objects</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {inferenceResults.detections.map((detection: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-900 rounded border border-gray-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                    <span className="text-sm text-white">{detection.label}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-400">
                      {(detection.confidence * 100).toFixed(1)}%
                    </span>
                    <div className="text-xs text-gray-400">
                      Box: [{detection.bbox?.map((coord: number) => coord.toFixed(0)).join(', ')}]
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Results (Collapsible) */}
        <details className="bg-gray-800 border border-gray-700 rounded-lg">
          <summary className="p-4 cursor-pointer text-sm font-semibold text-white">
            Raw Results (JSON)
          </summary>
          <div className="p-4 border-t border-gray-700">
            <pre className="text-xs text-gray-300 overflow-x-auto">
              {JSON.stringify(inferenceResults, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Image Preview */}
      {imagePreview && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Uploaded Image</h3>
          {renderImagePreview()}
        </div>
      )}

      {/* Start Inference Button */}
      {uploadedImage && !isProcessing && !inferenceResults && (
        <div className="text-center">
          <button
            onClick={handleStartInference}
            className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Start Inference
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Process image with {selectedModel} on GPU
          </p>
        </div>
      )}

      {/* Inference Results */}
      {renderInferenceResults()}

      {/* No Image State */}
      {!uploadedImage && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto text-gray-600 mb-4">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Image Selected</h3>
          <p className="text-gray-400">Upload an image to start inference</p>
        </div>
      )}
    </div>
  );
};
