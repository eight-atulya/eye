'use client';

import { useState, useEffect } from 'react';
import { EyeAIChat } from './EyeAIChat';
import { EyeAIVision } from './EyeAIVision';
import { EyeAIGenerate } from './EyeAIGenerate';
import { useEyeAIAPI } from '../hooks/useEyeAIAPI';

type TabType = 'chat' | 'vision' | 'generate';

export const EyeAIPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [selectedModel, setSelectedModel] = useState('gemma3:12b');
  const [temperature, setTemperature] = useState(0.7);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getModels, checkHealth, isLoading } = useEyeAIAPI();

  useEffect(() => {
    // Check health and load models on component mount
    const initializeEyeAI = async () => {
      try {
        console.log('Initializing EYE AI...');
        const health = await checkHealth();
        console.log('Health check result:', health);
        setIsHealthy(health);
        
        if (health) {
          console.log('Loading models...');
          const models = await getModels();
          console.log('Models loaded:', models);
          setAvailableModels(models);
        }
      } catch (error) {
        console.error('Failed to initialize EYE AI:', error);
        setIsHealthy(false);
      }
    };

    initializeEyeAI();
  }, []);

  const tabs = [
    { id: 'chat' as TabType, label: 'Chat', icon: '💬' },
    { id: 'vision' as TabType, label: 'Vision', icon: '👁️' },
    { id: 'generate' as TabType, label: 'Generate', icon: '✍️' },
  ];

  const renderActiveComponent = () => {
    const commonProps = {
      model: selectedModel,
      temperature,
      isProcessing: isLoading,
    };

    switch (activeTab) {
      case 'chat':
        return <EyeAIChat {...commonProps} />;
      case 'vision':
        return <EyeAIVision {...commonProps} />;
      case 'generate':
        return <EyeAIGenerate {...commonProps} />;
      default:
        return <EyeAIChat {...commonProps} />;
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">EYE AI</h1>
              <div className="ml-4 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isHealthy === null ? 'bg-yellow-500' : 
                  isHealthy ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-400">
                  {isHealthy === null ? 'Checking...' : 
                   isHealthy ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <nav className="hidden lg:flex space-x-8">
              <a href="/" className="text-gray-400 hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="/inference" className="text-gray-400 hover:text-white transition-colors">
                YOLO-E Inference
              </a>
              <a href="/eye-ai" className="text-white border-b-2 border-white">
                EYE AI
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content - Full Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50" />
            <div className="relative flex h-full">
              <div className="w-80 bg-gray-900 border-r border-gray-800 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Mobile Close Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Model Selection */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Model Settings</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Model
                        </label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          disabled={isLoading}
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        >
                          {availableModels.length > 0 ? (
                            availableModels.map((model) => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))
                          ) : (
                            <option value="gemma3:12b">gemma3:12b (default)</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Temperature: {temperature}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          disabled={isLoading}
                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Focused</span>
                          <span>Balanced</span>
                          <span>Creative</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Status</h2>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Service:</span>
                        <span className={isHealthy ? 'text-green-400' : 'text-red-400'}>
                          {isHealthy === null ? 'Checking...' : isHealthy ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Models:</span>
                        <span className="text-white">{availableModels.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">GPU:</span>
                        <span className="text-green-400">Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col border-r border-gray-800 bg-gray-900">
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Model Selection */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Model Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isLoading}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    {availableModels.length > 0 ? (
                      availableModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))
                    ) : (
                      <option value="gemma3:12b">gemma3:12b (default)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Temperature: {temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    disabled={isLoading}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Focused</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Status</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Service:</span>
                  <span className={isHealthy ? 'text-green-400' : 'text-red-400'}>
                    {isHealthy === null ? 'Checking...' : isHealthy ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Models:</span>
                  <span className="text-white">{availableModels.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">GPU:</span>
                  <span className="text-green-400">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area - Full Screen */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Controls Bar */}
          <div className="lg:hidden border-b border-gray-800 bg-gray-900 p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">Model: {selectedModel}</span>
                <span className="text-sm text-gray-400">Temp: {temperature}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isHealthy ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-400">
                  {isHealthy ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-800 bg-gray-900 flex-shrink-0">
            <nav className="flex space-x-8 px-4 sm:px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Chat Content - Full Height */}
          <div className="flex-1 min-h-0">
            {renderActiveComponent()}
          </div>
        </div>
      </div>
    </div>
  );
};