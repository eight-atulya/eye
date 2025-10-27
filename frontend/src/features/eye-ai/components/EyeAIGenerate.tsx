'use client';

import { useState } from 'react';
import { useEyeAIAPI } from '../hooks/useEyeAIAPI';

interface EyeAIGenerateProps {
  model?: string;
  temperature?: number;
  isProcessing?: boolean;
}

export const EyeAIGenerate = ({ model = 'gemma3:12b', temperature: initialTemperature = 0.7, isProcessing = false }: EyeAIGenerateProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">EYE AI Text Generation</h3>
        <span className="text-sm text-gray-400">Model: {model}</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">Text Generation Coming Soon</p>
          <p className="text-sm">Generate creative and technical content with EYE AI</p>
        </div>
      </div>
    </div>
  );
};
