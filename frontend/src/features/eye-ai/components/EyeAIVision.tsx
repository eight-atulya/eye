'use client';

import { useState, useRef, useCallback } from 'react';
import { useEyeAIAPI, ChatMessage } from '../hooks/useEyeAIAPI';

interface EyeAIVisionProps {
  model?: string;
  temperature?: number;
  isProcessing?: boolean;
}

interface VisionMessage extends ChatMessage {
  images?: string[];
}

export const EyeAIVision = ({ model = 'gemma3:12b', temperature = 0.7, isProcessing = false }: EyeAIVisionProps) => {
  const [messages, setMessages] = useState<VisionMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { visionChat, uploadImage, isLoading, error } = useEyeAIAPI();

  const handleImageSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file');
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  }, [handleImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageSelect(file);
    }
  }, [handleImageSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isProcessing || isAnalyzing) return;

    const userMessage: VisionMessage = {
      role: 'user',
      content: inputMessage.trim(),
      images: selectedImage ? [imagePreview!] : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsAnalyzing(true);

    try {
      let response;
      
      if (selectedImage) {
        // Use upload endpoint for image + question
        response = await uploadImage(selectedImage, inputMessage.trim());
      } else {
        // Use vision chat for text-only messages
        response = await visionChat({
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            images: msg.images
          })),
          model,
          temperature
        });
      }

      const assistantMessage: VisionMessage = {
        role: 'assistant',
        content: response.message?.content || response.response || 'No response received',
      };

      setMessages([...newMessages, assistantMessage]);
      
      // Clear image after successful analysis
      if (selectedImage) {
        clearImage();
      }
    } catch (err) {
      const errorMessage: VisionMessage = {
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to analyze image'}`,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    clearImage();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
        <h3 className="text-lg font-semibold text-white">EYE AI Vision</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Model: {model}</span>
          <button
            onClick={clearChat}
            disabled={messages.length === 0 || isLoading || isProcessing || isAnalyzing}
            className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-lg mb-2">Upload an image to get started</p>
            <p className="text-sm">Ask questions about images or get detailed analysis</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                {/* Show images in user messages */}
                {message.images && message.images.length > 0 && (
                  <div className="mb-2">
                    {message.images.map((img, imgIndex) => (
                      <img
                        key={imgIndex}
                        src={img}
                        alt="Uploaded"
                        className="max-w-full h-auto rounded max-h-48 object-contain"
                      />
                    ))}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
              </div>
            </div>
          ))
        )}
        
        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="ml-2">Analyzing image...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900 border border-red-700 text-red-100 flex-shrink-0">
          <p className="text-sm">Error: {error}</p>
        </div>
      )}

      {/* Image Upload Area */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Selected Image:</span>
              <button
                onClick={clearImage}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full h-auto rounded max-h-32 object-contain"
            />
          </div>
        )}

        {/* Upload Area */}
        {!imagePreview && (
          <div
            className="mb-4 p-6 border-2 border-dashed border-gray-600 rounded-lg text-center hover:border-gray-500 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-gray-400">
              <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm">Drop an image here or click to upload</p>
              <p className="text-xs mt-1">Supports JPG, PNG, GIF, WebP</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Input */}
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedImage ? "Ask a question about the image..." : "Upload an image first..."}
            disabled={isLoading || isProcessing || isAnalyzing}
            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || isProcessing || isAnalyzing || (!selectedImage && messages.length === 0)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
