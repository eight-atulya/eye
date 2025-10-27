/**
 * YOLO-E Dashboard Component
 * Main dashboard for YOLO-E operations
 */

'use client';

import { useState, useEffect } from 'react';
import { useYOLOEModel } from '../hooks/useYOLOE';

interface YOLOEDashboardProps {
  className?: string;
}

export const YOLOEDashboard = ({ className = '' }: YOLOEDashboardProps) => {
  const { modelInfo, loading, error, loadModelInfo } = useYOLOEModel();
  const [activeTab, setActiveTab] = useState<'overview' | 'training' | 'processing' | 'inference'>('overview');

  useEffect(() => {
    loadModelInfo();
  }, [loadModelInfo]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading YOLO-E model...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading YOLO-E model</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">YOLO-E Dashboard</h1>
            <p className="text-blue-100 mt-1">High-performance object detection with 4000+ classes</p>
          </div>
          {modelInfo && (
            <div className="text-right">
              <div className="text-sm text-blue-100">Model Status</div>
              <div className="text-lg font-semibold capitalize">{modelInfo.status}</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'training', label: 'Training', icon: '🎯' },
            { id: 'processing', label: 'Batch Processing', icon: '⚡' },
            { id: 'inference', label: 'Inference', icon: '🔍' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && <OverviewTab modelInfo={modelInfo} />}
        {activeTab === 'training' && <TrainingTab />}
        {activeTab === 'processing' && <ProcessingTab />}
        {activeTab === 'inference' && <InferenceTab />}
      </div>
    </div>
  );
};

const OverviewTab = ({ modelInfo }: { modelInfo: any }) => {
  if (!modelInfo) return null;

  return (
    <div className="space-y-6">
      {/* Model Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">4K</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Base Classes</p>
              <p className="text-2xl font-bold text-blue-600">{modelInfo.max_classes.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">⚡</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Few-Shot Learning</p>
              <p className="text-2xl font-bold text-green-600">{modelInfo.few_shot_support ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🎯</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Confidence</p>
              <p className="text-2xl font-bold text-purple-600">{modelInfo.confidence_threshold}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Details */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Model ID</p>
            <p className="font-medium">{modelInfo.model_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Device</p>
            <p className="font-medium capitalize">{modelInfo.device}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Loaded Classes</p>
            <p className="font-medium">{modelInfo.loaded_classes.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">IoU Threshold</p>
            <p className="font-medium">{modelInfo.iou_threshold}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Load Custom Model
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Start Training
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
            Process Images
          </button>
        </div>
      </div>
    </div>
  );
};

const TrainingTab = () => {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Training Module</h3>
            <p className="mt-1 text-sm text-yellow-700">Training interface will be implemented here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProcessingTab = () => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Batch Processing Module</h3>
            <p className="mt-1 text-sm text-blue-700">Batch processing interface will be implemented here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InferenceTab = () => {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Inference Module</h3>
            <p className="mt-1 text-sm text-green-700">Single image inference interface will be implemented here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
