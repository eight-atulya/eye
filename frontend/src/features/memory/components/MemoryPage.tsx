'use client';

import { useState, useEffect, useCallback } from 'react';
import { MemoryUpload } from './MemoryUpload';
import { MemorySearch } from './MemorySearch';
import { MemoryGrid } from './MemoryGrid';
import { useMemoryAPI, MemoryRecord } from '../hooks/useMemoryAPI';

type TabType = 'upload' | 'search' | 'browse';

export const MemoryPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [searchResults, setSearchResults] = useState<MemoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getUserMemories, deleteMemory, isLoading: apiLoading } = useMemoryAPI();

  // Load user memories on component mount
  useEffect(() => {
    loadUserMemories();
  }, []);

  const loadUserMemories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userMemories = await getUserMemories(100, 0);
      setMemories(userMemories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load memories';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getUserMemories]);

  const handleUploadComplete = useCallback((memoryId: string) => {
    console.log('Memory uploaded:', memoryId);
    // Reload memories to show the new one
    loadUserMemories();
  }, [loadUserMemories]);

  const handleUploadError = useCallback((error: string) => {
    setError(error);
  }, []);

  const handleSearchResults = useCallback((results: MemoryRecord[]) => {
    setSearchResults(results);
    setActiveTab('browse'); // Switch to browse tab to show results
  }, []);

  const handleSearchError = useCallback((error: string) => {
    setError(error);
  }, []);

  const handleMemoryDelete = useCallback(async (memoryId: string) => {
    try {
      await deleteMemory(memoryId);
      // Remove from local state
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      setSearchResults(prev => prev.filter(m => m.id !== memoryId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete memory';
      setError(errorMessage);
    }
  }, [deleteMemory]);

  const handleMemoryClick = useCallback((memory: MemoryRecord) => {
    console.log('Memory clicked:', memory);
    // Could open a detailed view or start a conversation
  }, []);

  const tabs = [
    { id: 'upload' as TabType, label: 'Upload', icon: '📸' },
    { id: 'search' as TabType, label: 'Search', icon: '🔍' },
    { id: 'browse' as TabType, label: 'Browse', icon: '🖼️' },
  ];

  const getDisplayMemories = () => {
    if (activeTab === 'browse' && searchResults.length > 0) {
      return searchResults;
    }
    return memories;
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-gray-900 border-r border-gray-800 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Memory Vault</h2>
          <p className="text-gray-400 text-sm mt-1">Preserve and explore your memories</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Total Memories:</span>
              <span className="text-white">{memories.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Search Results:</span>
              <span className="text-white">{searchResults.length}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 p-6 flex-shrink-0">
          <h1 className="text-xl font-semibold text-white">
            {activeTab === 'upload' && 'Upload New Memory'}
            {activeTab === 'search' && 'Search Memories'}
            {activeTab === 'browse' && (searchResults.length > 0 ? 'Search Results' : 'All Memories')}
          </h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">Error: {error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-red-400 hover:text-red-300 text-sm"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="max-w-2xl">
              <MemoryUpload
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </div>
          )}

          {activeTab === 'search' && (
            <div className="max-w-2xl">
              <MemorySearch
                onSearchResults={handleSearchResults}
                onSearchError={handleSearchError}
              />
            </div>
          )}

          {activeTab === 'browse' && (
            <div>
              {(isLoading || apiLoading) ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400">Loading memories...</span>
                  </div>
                </div>
              ) : (
                <MemoryGrid
                  memories={getDisplayMemories()}
                  onMemoryClick={handleMemoryClick}
                  onMemoryDelete={handleMemoryDelete}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
