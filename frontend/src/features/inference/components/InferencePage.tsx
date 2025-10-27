'use client';

import { useState } from 'react';
import { InferenceUpload } from './InferenceUpload';
import { InferenceResults } from './InferenceResults';
import { InferenceControls } from './InferenceControls';
import { InferenceStatus } from './InferenceStatus';
import { ClassSelector } from './ClassSelector';

export const InferencePage = () => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [inferenceResults, setInferenceResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('yoloe-11s-seg-pf.pt');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [promptMode, setPromptMode] = useState<string>('internal');

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
    setInferenceResults(null);
  };

  const handleInferenceComplete = (results: any) => {
    setInferenceResults(results);
    setIsProcessing(false);
    setProcessingStatus('Inference completed successfully');
  };

  const handleProcessingStart = () => {
    setIsProcessing(true);
    setProcessingStatus('Processing image with YOLO-E model...');
    setInferenceResults(null);
  };

  const handleProcessingError = (error: string) => {
    setIsProcessing(false);
    setProcessingStatus(`Error: ${error}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">YOLO-E Inference</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="/" className="text-gray-400 hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="/inference" className="text-white border-b-2 border-white">
                Inference
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Selection & Status */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Model Configuration</h2>
              
              <InferenceControls
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                isProcessing={isProcessing}
              />
              
              <InferenceStatus
                isProcessing={isProcessing}
                status={processingStatus}
              />
            </div>

            {/* Image Upload */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Image Upload</h2>
              <InferenceUpload
                onImageUpload={handleImageUpload}
                isProcessing={isProcessing}
              />
            </div>

            {/* Class Selection */}
            <ClassSelector
              selectedClasses={selectedClasses}
              onClassesChange={setSelectedClasses}
              promptMode={promptMode}
              onPromptModeChange={setPromptMode}
              isProcessing={isProcessing}
            />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Inference Results</h2>
              <InferenceResults
                uploadedImage={uploadedImage}
                inferenceResults={inferenceResults}
                isProcessing={isProcessing}
                onProcessingStart={handleProcessingStart}
                onProcessingComplete={handleInferenceComplete}
                onProcessingError={handleProcessingError}
                selectedModel={selectedModel}
                selectedClasses={selectedClasses}
                promptMode={promptMode}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
