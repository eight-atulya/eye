'use client';

import { useState, useEffect } from 'react';

interface Annotation {
  id: string;
  labelId: string;
  type: 'bbox' | 'polygon' | 'point' | 'mask';
  coordinates: { x: number; y: number }[];
  confidence?: number;
  attributes: Record<string, any>;
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'needs_revision';
}

interface QualityControlProps {
  onClose: () => void;
  selectedTask: string;
  annotations: Annotation[];
}

export const QualityControl = ({ onClose, selectedTask, annotations }: QualityControlProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected' | 'needs_revision'>('pending');
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (selectedTask) {
      loadQualityMetrics();
    }
  }, [selectedTask, annotations]);

  const loadQualityMetrics = async () => {
    try {
      setIsLoading(true);
      // Mock quality metrics calculation
      const metrics = {
        totalAnnotations: annotations.length,
        approvedAnnotations: annotations.filter(a => a.reviewStatus === 'approved').length,
        rejectedAnnotations: annotations.filter(a => a.reviewStatus === 'rejected').length,
        pendingAnnotations: annotations.filter(a => !a.reviewStatus || a.reviewStatus === 'pending').length,
        averageConfidence: annotations.reduce((sum, a) => sum + (a.confidence || 0), 0) / annotations.length || 0,
        qualityScore: 0
      };
      
      // Calculate quality score
      metrics.qualityScore = (
        (metrics.approvedAnnotations / metrics.totalAnnotations) * 0.6 +
        (metrics.averageConfidence) * 0.4
      ) * 100;
      
      setQualityMetrics(metrics);
    } catch (err) {
      setError('Failed to load quality metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const reviewAnnotation = async (annotation: Annotation, status: string, comment: string) => {
    try {
      setIsLoading(true);
      // Mock annotation review
      console.log('Reviewing annotation:', annotation.id, 'Status:', status, 'Comment:', comment);
      setSelectedAnnotation(null);
      setReviewComment('');
      loadQualityMetrics(); // Reload metrics
    } catch (err) {
      setError('Failed to review annotation');
    } finally {
      setIsLoading(false);
    }
  };

  const exportQualityReport = async () => {
    try {
      setIsLoading(true);
      // Mock quality report export
      console.log('Exporting quality report for task:', selectedTask);
    } catch (err) {
      setError('Failed to export quality report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">✅ Quality Control</h2>
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
            <span className="ml-2 text-white">Loading quality data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quality Metrics */}
            {qualityMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{qualityMetrics.totalAnnotations}</div>
                  <div className="text-gray-400 text-sm">Total Annotations</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{qualityMetrics.approvedAnnotations}</div>
                  <div className="text-gray-400 text-sm">Approved</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-400">{qualityMetrics.rejectedAnnotations}</div>
                  <div className="text-gray-400 text-sm">Rejected</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-400">{qualityMetrics.pendingAnnotations}</div>
                  <div className="text-gray-400 text-sm">Pending Review</div>
                </div>
              </div>
            )}

            {/* Quality Score */}
            {qualityMetrics && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📊 Quality Score</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">Overall Quality</span>
                      <span className="text-white font-semibold">{qualityMetrics.qualityScore.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          qualityMetrics.qualityScore >= 80 ? 'bg-green-600' :
                          qualityMetrics.qualityScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${qualityMetrics.qualityScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Average Confidence</div>
                    <div className="text-white font-semibold">{(qualityMetrics.averageConfidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Annotation Review */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">🔍 Annotation Review</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Annotation List */}
                <div>
                  <h4 className="text-white font-medium mb-3">Annotations to Review</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {annotations.map(annotation => (
                      <div 
                        key={annotation.id} 
                        className={`p-3 rounded cursor-pointer transition-colors ${
                          selectedAnnotation?.id === annotation.id 
                            ? 'bg-blue-600' 
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => setSelectedAnnotation(annotation)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white text-sm font-medium">
                              {annotation.type.toUpperCase()} Annotation
                            </div>
                            <div className="text-gray-400 text-xs">
                              {annotation.coordinates.length} points
                              {annotation.confidence && ` • ${(annotation.confidence * 100).toFixed(1)}% confidence`}
                            </div>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            annotation.reviewStatus === 'approved' ? 'bg-green-600' :
                            annotation.reviewStatus === 'rejected' ? 'bg-red-600' :
                            annotation.reviewStatus === 'needs_revision' ? 'bg-yellow-600' :
                            'bg-gray-600'
                          } text-white`}>
                            {annotation.reviewStatus || 'pending'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Panel */}
                <div>
                  <h4 className="text-white font-medium mb-3">Review Panel</h4>
                  {selectedAnnotation ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-700 rounded">
                        <div className="text-white font-medium mb-2">Selected Annotation</div>
                        <div className="text-gray-300 text-sm">
                          <div>Type: {selectedAnnotation.type}</div>
                          <div>Points: {selectedAnnotation.coordinates.length}</div>
                          {selectedAnnotation.confidence && (
                            <div>Confidence: {(selectedAnnotation.confidence * 100).toFixed(1)}%</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">Review Status</label>
                        <select
                          value={reviewStatus}
                          onChange={(e) => setReviewStatus(e.target.value as any)}
                          className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="needs_revision">Needs Revision</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">Review Comment</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Add review comments..."
                          className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                          rows={3}
                        />
                      </div>

                      <button
                        onClick={() => reviewAnnotation(selectedAnnotation, reviewStatus, reviewComment)}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit Review
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-8">
                      Select an annotation to review
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quality Control Actions */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">🛠️ Quality Control Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={exportQualityReport}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📊 Export Quality Report
                </button>
                <button
                  onClick={() => {/* Implement batch approval */}}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✅ Batch Approve
                </button>
                <button
                  onClick={() => {/* Implement quality rules */}}
                  disabled={isLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📋 Quality Rules
                </button>
              </div>
            </div>
          </div>
        )}

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
