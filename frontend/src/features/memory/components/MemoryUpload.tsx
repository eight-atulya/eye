'use client';

import { useState, useRef, useCallback } from 'react';
import { useMemoryAPI, MemoryUploadRequest } from '../hooks/useMemoryAPI';

interface MemoryUploadProps {
  onUploadComplete?: (memoryId: string) => void;
  onUploadError?: (error: string) => void;
}

export const MemoryUpload = ({ onUploadComplete, onUploadError }: MemoryUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [userTags, setUserTags] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadMemory, isLoading, error } = useMemoryAPI();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onUploadError?.('Please select a valid image file');
      return;
    }

    setIsUploading(true);
    
    try {
      const tags = userTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const uploadRequest: MemoryUploadRequest = {
        file,
        user_tags: tags.length > 0 ? tags : undefined,
        user_notes: userNotes || undefined,
        is_private: isPrivate,
      };

      const memoryId = await uploadMemory(uploadRequest);
      onUploadComplete?.(memoryId);
      
      // Reset form
      setUserTags('');
      setUserNotes('');
      setIsPrivate(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [userTags, userNotes, isPrivate, uploadMemory, onUploadComplete, onUploadError]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Upload Memory</h3>
      
      {/* Drag and Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <div className="text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg mb-2">Drop an image here or click to upload</p>
          <p className="text-sm">Supports JPG, PNG, GIF, WebP, BMP</p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={userTags}
            onChange={(e) => setUserTags(e.target.value)}
            placeholder="vacation, family, beach..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Add any notes about this memory..."
            rows={3}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPrivate"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-300">
            Keep this memory private
          </label>
        </div>
      </div>

      {/* Upload Status */}
      {(isUploading || isLoading) && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-300 text-sm">Uploading and processing memory...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">Error: {error}</p>
        </div>
      )}
    </div>
  );
};
