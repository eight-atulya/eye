'use client';

import { useState, useCallback } from 'react';
import { useMemoryAPI, MemoryRecord } from '../hooks/useMemoryAPI';

interface MemorySearchProps {
  onSearchResults?: (memories: MemoryRecord[]) => void;
  onSearchError?: (error: string) => void;
}

export const MemorySearch = ({ onSearchResults, onSearchError }: MemorySearchProps) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [includePrivate, setIncludePrivate] = useState(false);
  const [filterTags, setFilterTags] = useState('');
  
  const { searchMemories, isLoading, error } = useMemoryAPI();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    
    try {
      const tags = filterTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const memories = await searchMemories({
        query: query.trim(),
        limit: 20,
        include_private: includePrivate,
        filter_tags: tags.length > 0 ? tags : undefined,
      });

      onSearchResults?.(memories);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      onSearchError?.(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, [query, includePrivate, filterTags, searchMemories, onSearchResults, onSearchError]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Search Memories</h3>
      
      <div className="space-y-4">
        {/* Search Query */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search Query
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you're looking for..."
              className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isLoading || isSearching}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Filter Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Filter by Tags (comma-separated)
          </label>
          <input
            type="text"
            value={filterTags}
            onChange={(e) => setFilterTags(e.target.value)}
            placeholder="vacation, family, beach..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Options */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="includePrivate"
            checked={includePrivate}
            onChange={(e) => setIncludePrivate(e.target.checked)}
            className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="includePrivate" className="ml-2 text-sm text-gray-300">
            Include private memories
          </label>
        </div>
      </div>

      {/* Search Status */}
      {(isSearching || isLoading) && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-300 text-sm">Searching memories...</span>
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
