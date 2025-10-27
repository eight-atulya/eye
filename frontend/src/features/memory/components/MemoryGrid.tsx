'use client';

import { useState, useCallback } from 'react';
import { MemoryRecord } from '../hooks/useMemoryAPI';

interface MemoryGridProps {
  memories: MemoryRecord[];
  onMemoryClick?: (memory: MemoryRecord) => void;
  onMemoryDelete?: (memoryId: string) => void;
}

export const MemoryGrid = ({ memories, onMemoryClick, onMemoryDelete }: MemoryGridProps) => {
  const [selectedMemory, setSelectedMemory] = useState<MemoryRecord | null>(null);

  const handleMemoryClick = useCallback((memory: MemoryRecord) => {
    setSelectedMemory(memory);
    onMemoryClick?.(memory);
  }, [onMemoryClick]);

  const handleDelete = useCallback((e: React.MouseEvent, memoryId: string) => {
    e.stopPropagation();
    onMemoryDelete?.(memoryId);
  }, [onMemoryDelete]);

  const getGridSize = useCallback((index: number) => {
    // Create varied grid sizes for bento layout
    const sizes = [
      'col-span-2 row-span-2', // Large
      'col-span-1 row-span-1', // Small
      'col-span-2 row-span-1', // Wide
      'col-span-1 row-span-2', // Tall
      'col-span-1 row-span-1', // Small
      'col-span-2 row-span-2', // Large
    ];
    return sizes[index % sizes.length];
  }, []);

  if (memories.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
        <div className="text-gray-400">
          <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg mb-2">No memories found</p>
          <p className="text-sm">Upload some images to start building your memory collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Memory Grid */}
      <div className="grid grid-cols-4 gap-4 auto-rows-[200px]">
        {memories.map((memory, index) => (
          <div
            key={memory.id}
            className={`bg-gray-700 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${getGridSize(index)}`}
            onClick={() => handleMemoryClick(memory)}
          >
            {/* Image */}
            <div className="relative h-full w-full">
              <img
                src={memory.image_url}
                alt={memory.ai_description || 'Memory'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-medium truncate">
                    {memory.ai_description || 'No description'}
                  </p>
                  {memory.user_tags && memory.user_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {memory.user_tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-blue-600/80 text-white text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(e, memory.id)}
                  className="absolute top-2 right-2 p-1 bg-red-600/80 text-white rounded hover:bg-red-700/80 transition-colors"
                  title="Delete memory"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              {/* Similarity Score */}
              {memory.similarity_score && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-green-600/80 text-white text-xs rounded">
                  {Math.round(memory.similarity_score * 100)}% match
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex">
              {/* Image Side */}
              <div className="flex-1 max-w-md">
                <img
                  src={selectedMemory.image_url}
                  alt={selectedMemory.ai_description || 'Memory'}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Details Side */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-white">Memory Details</h3>
                  <button
                    onClick={() => setSelectedMemory(null)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* AI Description */}
                  {selectedMemory.ai_description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">AI Description</h4>
                      <p className="text-gray-100 text-sm">{selectedMemory.ai_description}</p>
                    </div>
                  )}
                  
                  {/* User Tags */}
                  {selectedMemory.user_tags && selectedMemory.user_tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedMemory.user_tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* User Notes */}
                  {selectedMemory.user_notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Notes</h4>
                      <p className="text-gray-100 text-sm">{selectedMemory.user_notes}</p>
                    </div>
                  )}
                  
                  {/* Detected Objects */}
                  {selectedMemory.detected_objects && selectedMemory.detected_objects.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Detected Objects</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedMemory.detected_objects.map((obj, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-600 text-gray-200 text-xs rounded"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Scene Context */}
                  {selectedMemory.scene_context && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Scene Context</h4>
                      <p className="text-gray-100 text-sm">{selectedMemory.scene_context}</p>
                    </div>
                  )}
                  
                  {/* Emotional Context */}
                  {selectedMemory.emotional_context && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Emotional Context</h4>
                      <p className="text-gray-100 text-sm">{selectedMemory.emotional_context}</p>
                    </div>
                  )}
                  
                  {/* Metadata */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Metadata</h4>
                    <div className="text-gray-400 text-sm space-y-1">
                      <p>Created: {new Date(selectedMemory.created_at).toLocaleString()}</p>
                      {selectedMemory.similarity_score && (
                        <p>Similarity: {Math.round(selectedMemory.similarity_score * 100)}%</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
