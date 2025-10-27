'use client';

import { useState, useCallback } from 'react';
import { useTrainingAPI } from '../hooks/useTrainingAPI';

interface TrainingPageProps {
  className?: string;
}

export const TrainingPage = ({ className = '' }: TrainingPageProps) => {
  const [activeTab, setActiveTab] = useState<'datasets' | 'training' | 'models'>('datasets');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const {
    uploadDataset,
    getDatasets,
    startTraining,
    getTrainingJobs,
    getTrainedModels,
  } = useTrainingAPI();

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const handleTabChange = useCallback((tab: 'datasets' | 'training' | 'models') => {
    setActiveTab(tab);
    clearMessages();
  }, [clearMessages]);

  return (
    <div className={`min-h-screen bg-black text-white ${className}`}>
      {/* Header */}
      <header className="border-b border-gray-800 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">YOLOE Training Pipeline</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="/" className="text-gray-400 hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="/inference" className="text-gray-400 hover:text-white transition-colors">
                Inference
              </a>
              <a href="/training" className="text-white border-b-2 border-white">
                Training
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Selection */}
        <div className="mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Project Selection</h2>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Enter project name..."
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={clearMessages}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Clear
              </button>
            </div>
            {selectedProject && (
              <p className="mt-2 text-sm text-gray-400">
                Working with project: <span className="text-white font-medium">{selectedProject}</span>
              </p>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-800">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('datasets')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'datasets'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Dataset Management
              </button>
              <button
                onClick={() => handleTabChange('training')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'training'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Model Training
              </button>
              <button
                onClick={() => handleTabChange('models')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'models'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Trained Models
              </button>
            </nav>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-900 border border-red-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-900 border border-green-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-200">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          {activeTab === 'datasets' && (
            <DatasetManagement
              selectedProject={selectedProject}
              onError={setError}
              onSuccess={setSuccess}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
          
          {activeTab === 'training' && (
            <ModelTraining
              selectedProject={selectedProject}
              onError={setError}
              onSuccess={setSuccess}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
          
          {activeTab === 'models' && (
            <TrainedModels
              selectedProject={selectedProject}
              onError={setError}
              onSuccess={setSuccess}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// Dataset Management Component
interface DatasetManagementProps {
  selectedProject: string;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const DatasetManagement = ({ selectedProject, onError, onSuccess, isLoading, setIsLoading }: DatasetManagementProps) => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [classes, setClasses] = useState('');

  const { uploadDataset, getDatasets } = useTrainingAPI();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadFiles(files);
  };

  const handleDatasetUpload = async () => {
    if (!selectedProject) {
      onError('Please select a project first');
      return;
    }

    if (!datasetName) {
      onError('Please enter a dataset name');
      return;
    }

    if (uploadFiles.length === 0) {
      onError('Please select files to upload');
      return;
    }

    try {
      setIsLoading(true);
      onError('');
      
      const classList = classes.split(',').map(cls => cls.trim()).filter(cls => cls);
      
      const result = await uploadDataset(
        uploadFiles,
        selectedProject,
        datasetName,
        description,
        classList
      );

      onSuccess(`Dataset "${datasetName}" uploaded successfully with ${result.uploaded_files} files`);
      setUploadFiles([]);
      setDatasetName('');
      setDescription('');
      setClasses('');
      
      // Refresh datasets list
      await loadDatasets();
    } catch (error: any) {
      onError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDatasets = async () => {
    if (!selectedProject) return;

    try {
      const result = await getDatasets(selectedProject);
      setDatasets(result);
    } catch (error: any) {
      onError(error.message);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-6">Dataset Management</h3>
      
      {/* Upload Section */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-white mb-4">Upload New Dataset</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dataset Name
            </label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="Enter dataset name..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter dataset description..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Classes (comma-separated)
            </label>
            <input
              type="text"
              value={classes}
              onChange={(e) => setClasses(e.target.value)}
              placeholder="person, car, bicycle, ..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Files (images and annotations)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.txt,.yaml,.yml"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            {uploadFiles.length > 0 && (
              <p className="mt-2 text-sm text-gray-400">
                Selected {uploadFiles.length} files
              </p>
            )}
          </div>

          <button
            onClick={handleDatasetUpload}
            disabled={isLoading || !selectedProject}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Uploading...' : 'Upload Dataset'}
          </button>
        </div>
      </div>

      {/* Datasets List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-white">Existing Datasets</h4>
          <button
            onClick={loadDatasets}
            disabled={!selectedProject}
            className="px-3 py-1 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
          >
            Refresh
          </button>
        </div>

        {datasets.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            {selectedProject ? 'No datasets found for this project' : 'Select a project to view datasets'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((dataset, index) => (
              <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-white mb-2">{dataset.dataset_name}</h5>
                <p className="text-sm text-gray-400 mb-2">Project: {dataset.project_name}</p>
                <p className="text-sm text-gray-400 mb-2">
                  Images: {dataset.images_count} | Labels: {dataset.labels_count}
                </p>
                <p className="text-xs text-gray-500">{dataset.path}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Model Training Component
interface ModelTrainingProps {
  selectedProject: string;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ModelTraining = ({ selectedProject, onError, onSuccess, isLoading, setIsLoading }: ModelTrainingProps) => {
  const [trainingConfig, setTrainingConfig] = useState({
    dataset_path: '',
    base_model: 'yoloe-11s-seg-pf.pt',
    epochs: 50,
    batch_size: 8,
    learning_rate: 0.001,
    image_size: 640,
    patience: 10,
    validation_split: 0.2,
    description: '',
  });

  const [trainingJobs, setTrainingJobs] = useState<any[]>([]);

  const { startTraining, getTrainingJobs } = useTrainingAPI();

  const handleStartTraining = async () => {
    if (!selectedProject) {
      onError('Please select a project first');
      return;
    }

    if (!trainingConfig.dataset_path) {
      onError('Please select a dataset');
      return;
    }

    try {
      setIsLoading(true);
      onError('');
      
      const result = await startTraining({
        project_name: selectedProject,
        ...trainingConfig,
      });

      onSuccess(`Training job started with ID: ${result.job_id}`);
      
      // Refresh training jobs list
      await loadTrainingJobs();
    } catch (error: any) {
      onError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrainingJobs = async () => {
    if (!selectedProject) return;

    try {
      const result = await getTrainingJobs(selectedProject);
      setTrainingJobs(result);
    } catch (error: any) {
      onError(error.message);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-6">Model Training</h3>
      
      {/* Training Configuration */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-white mb-4">Training Configuration</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dataset Path
            </label>
            <input
              type="text"
              value={trainingConfig.dataset_path}
              onChange={(e) => setTrainingConfig(prev => ({ ...prev, dataset_path: e.target.value }))}
              placeholder="Enter dataset path..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Base Model
            </label>
            <select
              value={trainingConfig.base_model}
              onChange={(e) => setTrainingConfig(prev => ({ ...prev, base_model: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="yoloe-11s-seg-pf.pt">YOLOE 11S (Prompt-Free)</option>
              <option value="yoloe-11m-seg.pt">YOLOE 11M</option>
              <option value="yoloe-11l-seg.pt">YOLOE 11L</option>
              <option value="yolo11n.pt">YOLO11 Nano</option>
              <option value="yolo11s.pt">YOLO11 Small</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Epochs
            </label>
            <input
              type="number"
              value={trainingConfig.epochs}
              onChange={(e) => setTrainingConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
              min="1"
              max="200"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Batch Size
            </label>
            <input
              type="number"
              value={trainingConfig.batch_size}
              onChange={(e) => setTrainingConfig(prev => ({ ...prev, batch_size: parseInt(e.target.value) }))}
              min="1"
              max="32"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Learning Rate
            </label>
            <input
              type="number"
              step="0.0001"
              value={trainingConfig.learning_rate}
              onChange={(e) => setTrainingConfig(prev => ({ ...prev, learning_rate: parseFloat(e.target.value) }))}
              min="0.0001"
              max="0.1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Image Size
            </label>
            <input
              type="number"
              value={trainingConfig.image_size}
              onChange={(e) => setTrainingConfig(prev => ({ ...prev, image_size: parseInt(e.target.value) }))}
              min="320"
              max="1280"
              step="32"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={trainingConfig.description}
            onChange={(e) => setTrainingConfig(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter training description..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleStartTraining}
          disabled={isLoading || !selectedProject}
          className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Starting Training...' : 'Start Training'}
        </button>
      </div>

      {/* Training Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-white">Training Jobs</h4>
          <button
            onClick={loadTrainingJobs}
            disabled={!selectedProject}
            className="px-3 py-1 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
          >
            Refresh
          </button>
        </div>

        {trainingJobs.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            {selectedProject ? 'No training jobs found for this project' : 'Select a project to view training jobs'}
          </p>
        ) : (
          <div className="space-y-4">
            {trainingJobs.map((job, index) => (
              <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-white">Job {job.job_id.slice(0, 8)}...</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'completed' ? 'bg-green-900 text-green-200' :
                    job.status === 'running' ? 'bg-blue-900 text-blue-200' :
                    job.status === 'failed' ? 'bg-red-900 text-red-200' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-2">Project: {job.project_name}</p>
                <p className="text-sm text-gray-400 mb-2">
                  Progress: {job.progress}% ({job.current_epoch}/{job.total_epochs} epochs)
                </p>
                {job.best_metrics && (
                  <p className="text-sm text-gray-400 mb-2">
                    Best mAP: {job.best_metrics.mAP?.toFixed(3) || 'N/A'}
                  </p>
                )}
                <p className="text-xs text-gray-500">Created: {new Date(job.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Trained Models Component
interface TrainedModelsProps {
  selectedProject: string;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const TrainedModels = ({ selectedProject, onError, onSuccess, isLoading, setIsLoading }: TrainedModelsProps) => {
  const [trainedModels, setTrainedModels] = useState<any[]>([]);

  const { getTrainedModels } = useTrainingAPI();

  const loadTrainedModels = async () => {
    if (!selectedProject) return;

    try {
      const result = await getTrainedModels(selectedProject);
      setTrainedModels(result);
    } catch (error: any) {
      onError(error.message);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-6">Trained Models</h3>
      
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-medium text-white">Available Models</h4>
        <button
          onClick={loadTrainedModels}
          disabled={!selectedProject}
          className="px-3 py-1 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
        >
          Refresh
        </button>
      </div>

      {trainedModels.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          {selectedProject ? 'No trained models found for this project' : 'Select a project to view trained models'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainedModels.map((model, index) => (
            <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-white mb-2">{model.model_name}</h5>
              <p className="text-sm text-gray-400 mb-2">Project: {model.project_name}</p>
              <p className="text-sm text-gray-400 mb-2">Size: {model.size_mb.toFixed(1)} MB</p>
              <p className="text-xs text-gray-500 mb-4">
                Created: {new Date(model.created_at * 1000).toLocaleString()}
              </p>
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                  Use for Inference
                </button>
                <button className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
