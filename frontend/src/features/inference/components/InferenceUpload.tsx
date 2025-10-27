'use client';

import { useCallback, useRef, useState } from 'react';

interface InferenceUploadProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
}

export const InferenceUpload = ({ onImageUpload, isProcessing }: InferenceUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${dragActive ? 'border-white bg-gray-800' : 'border-gray-600 hover:border-gray-400'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          disabled={isProcessing}
          className="hidden"
        />
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-white">
              {isProcessing ? 'Processing...' : 'Drop image here'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              or click to browse files
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports: JPEG, PNG, WebP, BMP, TIFF
            </p>
          </div>
        </div>
      </div>

      {/* Upload Instructions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Upload Guidelines</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Maximum file size: 50MB</li>
          <li>• Supported formats: JPEG, PNG, WebP, BMP, TIFF</li>
          <li>• Recommended resolution: 640x640 or higher</li>
          <li>• GPU processing enabled for faster inference</li>
        </ul>
      </div>
    </div>
  );
};
