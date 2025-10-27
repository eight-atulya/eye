'use client';

import { useState, useEffect } from 'react';

interface CollaborationPanelProps {
  onClose: () => void;
  selectedTask: string;
}

export const CollaborationPanel = ({ onClose, selectedTask }: CollaborationPanelProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [assignee, setAssignee] = useState('');

  useEffect(() => {
    if (selectedTask) {
      loadCollaborationData();
    }
  }, [selectedTask]);

  const loadCollaborationData = async () => {
    try {
      setIsLoading(true);
      // Mock data for now - would be loaded from backend
      setCollaborators([
        { id: '1', name: 'John Doe', role: 'annotator', status: 'active' },
        { id: '2', name: 'Jane Smith', role: 'reviewer', status: 'active' },
        { id: '3', name: 'Mike Johnson', role: 'annotator', status: 'inactive' }
      ]);
      
      setComments([
        { id: '1', author: 'John Doe', text: 'This annotation looks good', timestamp: '2024-01-15 10:30', type: 'comment' },
        { id: '2', author: 'Jane Smith', text: 'Please review the bounding box accuracy', timestamp: '2024-01-15 11:15', type: 'review' }
      ]);
    } catch (err) {
      setError('Failed to load collaboration data');
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsLoading(true);
      // Mock comment addition
      const comment = {
        id: Date.now().toString(),
        author: 'Current User',
        text: newComment,
        timestamp: new Date().toISOString(),
        type: 'comment'
      };
      setComments([...comments, comment]);
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };

  const assignTask = async () => {
    if (!assignee.trim()) return;

    try {
      setIsLoading(true);
      // Mock task assignment
      setSuccess(`Task assigned to ${assignee}`);
    } catch (err) {
      setError('Failed to assign task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">👥 Collaboration Panel</h2>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Members */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">👥 Team Members</h3>
            
            <div className="space-y-3">
              {collaborators.map(collaborator => (
                <div key={collaborator.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      collaborator.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <div className="text-white font-medium">{collaborator.name}</div>
                      <div className="text-gray-400 text-sm">{collaborator.role}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {collaborator.status}
                  </div>
                </div>
              ))}
            </div>

            {/* Task Assignment */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-white font-medium mb-2">Assign Task</h4>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Assignee name"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                />
                <button
                  onClick={assignTask}
                  disabled={isLoading || !assignee.trim()}
                  className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>

          {/* Comments & Reviews */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">💬 Comments & Reviews</h3>
            
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {comments.map(comment => (
                <div key={comment.id} className="p-3 bg-gray-700 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">{comment.author}</span>
                    <span className="text-gray-400 text-xs">{comment.timestamp}</span>
                  </div>
                  <div className="text-gray-300 text-sm">{comment.text}</div>
                  {comment.type === 'review' && (
                    <div className="mt-2">
                      <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                        Review
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700 pt-4">
              <textarea
                placeholder="Add a comment or review..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm mb-2"
                rows={3}
              />
              <button
                onClick={addComment}
                disabled={isLoading || !newComment.trim()}
                className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>

        {/* Collaboration Features */}
        <div className="mt-6 bg-blue-900 border border-blue-800 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-200 mb-2">🤝 Collaboration Features</h4>
          <div className="text-blue-300 text-sm space-y-1">
            <div>• Real-time task assignment and tracking</div>
            <div>• Comment and review system</div>
            <div>• Team member status monitoring</div>
            <div>• Quality control workflows</div>
            <div>• Notification system</div>
            <div>• Activity logging and audit trails</div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
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
