'use client';

import { useState, useEffect } from 'react';
import { useInferenceAPI } from '../hooks/useInferenceAPI';

interface ClassSelectorProps {
  selectedClasses: string[];
  onClassesChange: (classes: string[]) => void;
  promptMode: string;
  onPromptModeChange: (mode: string) => void;
  isProcessing: boolean;
}

export const ClassSelector = ({ 
  selectedClasses, 
  onClassesChange, 
  promptMode, 
  onPromptModeChange, 
  isProcessing 
}: ClassSelectorProps) => {
  const [baseClasses, setBaseClasses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBaseClasses, setShowBaseClasses] = useState(false);
  const [customClassInput, setCustomClassInput] = useState('');
  const { getBaseClasses } = useInferenceAPI();

  useEffect(() => {
    const loadBaseClasses = async () => {
      try {
        const classes = await getBaseClasses();
        setBaseClasses(classes);
      } catch (error) {
        console.error('Failed to load base classes:', error);
      }
    };
    loadBaseClasses();
  }, [getBaseClasses]);

  const filteredClasses = baseClasses.filter(cls => 
    cls.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addCustomClass = () => {
    if (customClassInput.trim() && !selectedClasses.includes(customClassInput.trim())) {
      onClassesChange([...selectedClasses, customClassInput.trim()]);
      setCustomClassInput('');
    }
  };

  const removeClass = (classToRemove: string) => {
    onClassesChange(selectedClasses.filter(cls => cls !== classToRemove));
  };

  const addBaseClass = (className: string) => {
    if (!selectedClasses.includes(className)) {
      onClassesChange([...selectedClasses, className]);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Class Selection</h2>
      
      {/* Prompt Mode Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Prompt Mode
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="internal"
              checked={promptMode === "internal"}
              onChange={(e) => onPromptModeChange(e.target.value)}
              disabled={isProcessing}
              className="mr-2 text-blue-600"
            />
            <span className="text-white">Internal (1200+ base classes)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="text"
              checked={promptMode === "text"}
              onChange={(e) => onPromptModeChange(e.target.value)}
              disabled={isProcessing}
              className="mr-2 text-blue-600"
            />
            <span className="text-white">Text Prompts</span>
          </label>
        </div>
      </div>

      {/* Custom Class Input */}
      {promptMode === "text" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Custom Classes
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={customClassInput}
              onChange={(e) => setCustomClassInput(e.target.value)}
              placeholder="Enter class name (e.g., person, car, dog)"
              disabled={isProcessing}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addCustomClass()}
            />
            <button
              onClick={addCustomClass}
              disabled={isProcessing || !customClassInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Selected Classes */}
      {selectedClasses.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Selected Classes ({selectedClasses.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedClasses.map((cls, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
              >
                {cls}
                <button
                  onClick={() => removeClass(cls)}
                  disabled={isProcessing}
                  className="ml-2 text-blue-200 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Base Classes Browser */}
      {promptMode === "text" && (
        <div>
          <button
            onClick={() => setShowBaseClasses(!showBaseClasses)}
            disabled={isProcessing}
            className="text-blue-400 hover:text-blue-300 text-sm mb-2"
          >
            {showBaseClasses ? 'Hide' : 'Show'} Base Classes ({baseClasses.length})
          </button>
          
          {showBaseClasses && (
            <div className="border border-gray-700 rounded-md p-4 bg-gray-800 max-h-64 overflow-y-auto">
              <div className="mb-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search classes..."
                  disabled={isProcessing}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredClasses.slice(0, 50).map((cls, index) => (
                  <button
                    key={index}
                    onClick={() => addBaseClass(cls)}
                    disabled={isProcessing || selectedClasses.includes(cls)}
                    className={`text-left px-2 py-1 text-sm rounded ${
                      selectedClasses.includes(cls)
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
              {filteredClasses.length > 50 && (
                <p className="text-gray-400 text-xs mt-2">
                  Showing first 50 results. Use search to find specific classes.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode Description */}
      <div className="mt-4 p-3 bg-gray-800 rounded-md">
        <p className="text-sm text-gray-300">
          {promptMode === "internal" ? (
            <>
              <strong>Internal Mode:</strong> Uses YOLOE's built-in vocabulary of 1200+ classes from LVIS and Objects365 datasets. 
              Automatically detects objects without specifying classes.
            </>
          ) : (
            <>
              <strong>Text Prompt Mode:</strong> Specify custom classes for targeted detection. 
              Add classes manually or select from the base vocabulary.
            </>
          )}
        </p>
      </div>
    </div>
  );
};
