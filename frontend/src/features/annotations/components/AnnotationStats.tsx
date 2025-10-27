'use client';

import { useState, useEffect } from 'react';

interface AnnotationStatsProps {
  onClose: () => void;
  selectedProject: string;
  selectedTask: string;
}

export const AnnotationStats = ({ onClose, selectedProject, selectedTask }: AnnotationStatsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, [selectedProject, selectedTask]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8001/api/v1/annotations/stats');
      const data = await response.json();
      
      if (data.status === 'success') {
        setStats(data);
      } else {
        setError('Failed to load statistics');
      }
    } catch (err) {
      setError('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">📊 Annotation Statistics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-800 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-2 text-white">Loading statistics...</span>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Overall Stats */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">📈 Overall Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Projects:</span>
                  <span className="text-white font-semibold">{stats.total_projects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Tasks:</span>
                  <span className="text-white font-semibold">{stats.total_tasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Annotations:</span>
                  <span className="text-white font-semibold">{stats.total_annotations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Completion Rate:</span>
                  <span className="text-white font-semibold">{stats.completion_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Avg Quality Score:</span>
                  <span className="text-white font-semibold">{stats.average_quality_score.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Pending Reviews:</span>
                  <span className="text-white font-semibold">{stats.pending_reviews}</span>
                </div>
              </div>
            </div>

            {/* Progress Chart */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Progress Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300 text-sm">Completion Rate</span>
                    <span className="text-white text-sm font-semibold">{stats.completion_rate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.completion_rate}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300 text-sm">Quality Score</span>
                    <span className="text-white text-sm font-semibold">{stats.average_quality_score.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.average_quality_score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Stats */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">👥 Team Statistics</h3>
              <div className="space-y-3">
                {stats.team_stats && Object.keys(stats.team_stats).length > 0 ? (
                  Object.entries(stats.team_stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-300 capitalize">{key.replace('_', ' ')}:</span>
                      <span className="text-white font-semibold">{value as number}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">No team data available</div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 md:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-semibold text-white mb-4">🕒 Recent Activity</h3>
              <div className="text-gray-400 text-sm">
                Activity tracking will be implemented in future updates
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded font-medium hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
