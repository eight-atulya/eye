'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnnotationCanvas } from './AnnotationCanvas';
import { CVATIntegration } from './CVATIntegration';
import { AnnotationStats } from './AnnotationStats';
import { CollaborationPanel } from './CollaborationPanel';
import { QualityControl } from './QualityControl';

// Enhanced Types
interface Label {
  id: string;
  name: string;
  color: string;
  category: string;
  attributes?: Record<string, any>;
}

interface Annotation {
  id: string;
  labelId: string;
  type: 'bbox' | 'polygon' | 'point' | 'mask';
  coordinates: { x: number; y: number }[];
  confidence?: number;
  attributes: Record<string, any>;
  createdBy?: string;
  reviewedBy?: string;
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  createdAt?: string;
  updatedAt?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  labels: Label[];
  settings: Record<string, any>;
  metrics: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  status: string;
}

interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  images: string[];
  annotations: Record<string, Annotation[]>;
  status: string;
  assignedTo?: string;
  priority: string;
  dueDate?: string;
  progress: number;
  qualityScore?: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

interface AnnotationPageProps {
  className?: string;
}

export const AnnotationPage = ({ className = '' }: AnnotationPageProps) => {
  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [annotations, setAnnotations] = useState<Record<string, Annotation[]>>({});
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Enhanced state for professional features
  const [showCVATIntegration, setShowCVATIntegration] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showQualityControl, setShowQualityControl] = useState(false);
  const [annotationMode, setAnnotationMode] = useState<'eye' | 'cvat'>('eye');
  const [autoSave, setAutoSave] = useState(true);
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  
  // Form states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssignee, setTaskAssignee] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadProjects();
    loadStats();
  }, []);

  // Load tasks when project changes
  useEffect(() => {
    if (selectedProject) {
      loadTasks(selectedProject);
      loadProjectLabels(selectedProject);
    }
  }, [selectedProject]);

  // Load annotations when task changes
  useEffect(() => {
    if (selectedTask) {
      loadTaskDetails(selectedTask);
    }
  }, [selectedTask]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && selectedTask && Object.keys(annotations).length > 0) {
      const timeoutId = setTimeout(() => {
        saveAnnotations();
      }, 5000); // Auto-save every 5 seconds
      
      return () => clearTimeout(timeoutId);
    }
  }, [annotations, autoSave, selectedTask]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!keyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            saveAnnotations();
            break;
          case 'z':
            event.preventDefault();
            undoLastAnnotation();
            break;
          case 'y':
            event.preventDefault();
            redoLastAnnotation();
            break;
          case 'g':
            event.preventDefault();
            setGridEnabled(!gridEnabled);
            break;
          case '=':
          case '+':
            event.preventDefault();
            setZoomLevel(prev => Math.min(prev * 1.2, 5));
            break;
          case '-':
            event.preventDefault();
            setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
            break;
          case '0':
            event.preventDefault();
            setZoomLevel(1);
            break;
        }
      }
      
      // Number keys for quick label selection
      if (event.key >= '1' && event.key <= '9') {
        const labelIndex = parseInt(event.key) - 1;
        if (labels[labelIndex]) {
          setSelectedLabel(labels[labelIndex].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts, gridEnabled, zoomLevel, labels]);

  // API Functions
  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8001/api/v1/annotations/projects');
      const data = await response.json();
      
      if (data.status === 'success') {
        setProjects(data.projects);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async (projectId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8001/api/v1/annotations/tasks?project_id=${projectId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setTasks(data.tasks);
      } else {
        setError('Failed to load tasks');
      }
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectLabels = async (projectId: string) => {
    try {
      const response = await fetch(`http://localhost:8001/api/v1/annotations/projects/${projectId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        const projectLabels = data.project.labels.map((label: any, index: number) => ({
          id: label.id || index.toString(),
          name: label.name,
          color: label.color || `#${Math.floor(Math.random()*16777215).toString(16)}`,
          category: label.category || 'object',
          attributes: label.attributes || {}
        }));
        setLabels(projectLabels);
      }
    } catch (err) {
      console.error('Failed to load project labels:', err);
    }
  };

  const loadTaskDetails = async (taskId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8001/api/v1/annotations/tasks/${taskId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        const task = data.task;
        setAnnotations(task.annotations || {});
        setCurrentImageIndex(0);
      } else {
        setError('Failed to load task details');
      }
    } catch (err) {
      setError('Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/v1/annotations/stats');
      const data = await response.json();
      
      if (data.status === 'success') {
        // Update stats display
        console.log('Annotation stats:', data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      setIsLoading(true);
      const projectData = {
        name: newProjectName,
        description: newProjectDescription,
        labels: [],
        settings: {},
        team_id: null
      };

      const response = await fetch('http://localhost:8001/api/v1/annotations/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData)
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setNewProjectName('');
        setNewProjectDescription('');
        setSuccess('Project created successfully');
        loadProjects();
      } else {
        setError('Failed to create project');
      }
    } catch (err) {
      setError('Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTaskName.trim() || !selectedProject || uploadedFiles.length === 0) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('project_id', selectedProject);
      formData.append('name', newTaskName);
      formData.append('description', newTaskDescription);
      formData.append('assigned_to', taskAssignee);
      formData.append('priority', taskPriority);
      
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('http://localhost:8001/api/v1/annotations/tasks', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setNewTaskName('');
        setNewTaskDescription('');
        setUploadedFiles([]);
        setTaskAssignee('');
        setTaskPriority('medium');
        setSuccess('Task created successfully');
        loadTasks(selectedProject);
      } else {
        setError('Failed to create task');
      }
    } catch (err) {
      setError('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnnotations = async () => {
    if (!selectedTask || !selectedProject) return;

    try {
      setIsLoading(true);
      const currentTask = tasks.find(t => t.id === selectedTask);
      if (!currentTask) return;

      const currentImage = currentTask.images[currentImageIndex];
      if (!currentImage) return;

      const formData = new FormData();
      formData.append('image_filename', currentImage);
      formData.append('annotations_json', JSON.stringify(getCurrentImageAnnotations()));

      const response = await fetch(`http://localhost:8001/api/v1/annotations/tasks/${selectedTask}/annotations`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setSuccess('Annotations saved successfully');
        setError('');
      } else {
        setError('Failed to save annotations');
      }
    } catch (err) {
      setError('Failed to save annotations');
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(files);
  };

  const getCurrentImageUrl = () => {
    if (!selectedTask) return '';
    const currentTask = tasks.find(t => t.id === selectedTask);
    if (!currentTask || !currentTask.images[currentImageIndex]) return '';
    
    return `http://localhost:8001/api/v1/annotations/tasks/${selectedTask}/images/${currentTask.images[currentImageIndex]}`;
  };

  const getCurrentImageAnnotations = (): Annotation[] => {
    if (!selectedTask) return [];
    const currentTask = tasks.find(t => t.id === selectedTask);
    if (!currentTask || !currentTask.images[currentImageIndex]) return [];
    
    return annotations[currentTask.images[currentImageIndex]] || [];
  };

  const handleAnnotationsChange = (newAnnotations: Annotation[]) => {
    if (!selectedTask) return;
    const currentTask = tasks.find(t => t.id === selectedTask);
    if (!currentTask || !currentTask.images[currentImageIndex]) return;
    
    setAnnotations({
      ...annotations,
      [currentTask.images[currentImageIndex]]: newAnnotations
    });
  };

  const undoLastAnnotation = () => {
    const currentAnnotations = getCurrentImageAnnotations();
    if (currentAnnotations.length > 0) {
      const newAnnotations = currentAnnotations.slice(0, -1);
      handleAnnotationsChange(newAnnotations);
    }
  };

  const redoLastAnnotation = () => {
    // Implementation for redo functionality
    // This would require maintaining an undo/redo stack
  };

  const clearAnnotations = () => {
    if (confirm('Are you sure you want to clear all annotations for this image?')) {
      handleAnnotationsChange([]);
    }
  };

  const exportAnnotations = async (format: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8001/api/v1/annotations/tasks/${selectedTask}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: format,
          include_images: false
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setSuccess(`Annotations exported in ${format} format`);
      } else {
        setError('Failed to export annotations');
      }
    } catch (err) {
      setError('Failed to export annotations');
    } finally {
      setIsLoading(false);
    }
  };

  const preLabelWithAI = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8001/api/v1/annotations/tasks/${selectedTask}/pre-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          model_name: 'yoloe-11s-seg-pf.pt',
          confidence_threshold: '0.5',
          use_gpu: 'true'
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setSuccess('AI pre-labeling started');
        // Reload task details to get updated annotations
        loadTaskDetails(selectedTask);
      } else {
        setError('Failed to start AI pre-labeling');
      }
    } catch (err) {
      setError('Failed to start AI pre-labeling');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear messages after timeout
  useEffect(() => {
    if (success) {
      const timeoutId = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timeoutId = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [error]);

  return (
    <div className={`min-h-screen bg-black text-white ${className}`}>
      {/* Enhanced Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-white">EYE - Professional Annotation System</h1>
                <p className="text-gray-400">Industrial-grade annotation interface with CVAT integration</p>
              </div>
              
              {/* Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Mode:</span>
                <button
                  onClick={() => setAnnotationMode('eye')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    annotationMode === 'eye' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  EYE Native
                </button>
                <button
                  onClick={() => setAnnotationMode('cvat')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    annotationMode === 'cvat' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  CVAT Integration
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Professional Tools */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="bg-gray-700 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                >
                  📊 Stats
                </button>
                <button
                  onClick={() => setShowCollaboration(!showCollaboration)}
                  className="bg-gray-700 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                >
                  👥 Collaboration
                </button>
                <button
                  onClick={() => setShowQualityControl(!showQualityControl)}
                  className="bg-gray-700 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                >
                  ✅ Quality Control
                </button>
                <button
                  onClick={() => setShowCVATIntegration(!showCVATIntegration)}
                  className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  🔗 CVAT
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={saveAnnotations}
                  disabled={isLoading || !selectedTask}
                  className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : '💾 Save'}
                </button>
                <button
                  onClick={() => exportAnnotations('coco')}
                  disabled={isLoading || !selectedTask}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📤 Export
                </button>
                <button
                  onClick={preLabelWithAI}
                  disabled={isLoading || !selectedTask}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🤖 AI Pre-label
                </button>
              </div>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Auto-save:</span>
                <button
                  onClick={() => setAutoSave(!autoSave)}
                  className={`px-2 py-1 rounded text-xs ${
                    autoSave ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {autoSave ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Shortcuts:</span>
                <button
                  onClick={() => setKeyboardShortcuts(!keyboardShortcuts)}
                  className={`px-2 py-1 rounded text-xs ${
                    keyboardShortcuts ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {keyboardShortcuts ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Grid:</span>
                <button
                  onClick={() => setGridEnabled(!gridEnabled)}
                  className={`px-2 py-1 rounded text-xs ${
                    gridEnabled ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {gridEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Zoom:</span>
                <span className="text-white font-mono">{Math.round(zoomLevel * 100)}%</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedTask && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Progress:</span>
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${tasks.find(t => t.id === selectedTask)?.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-white text-xs">
                    {Math.round(tasks.find(t => t.id === selectedTask)?.progress || 0)}%
                  </span>
                </div>
              )}
              {success && (
                <div className="text-green-400 text-sm">✅ {success}</div>
              )}
              {error && (
                <div className="text-red-400 text-sm">❌ {error}</div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Enhanced Project & Task Management */}
          <div className="lg:col-span-1 space-y-6">
            {/* Project Management */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                📁 Projects
                <span className="ml-2 text-xs bg-gray-700 px-2 py-1 rounded">
                  {projects.length}
                </span>
              </h2>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="Project description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                  rows={2}
                />
                <button
                  onClick={createProject}
                  disabled={isLoading || !newProjectName.trim()}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ➕ Create Project
                </button>
              </div>

              <div className="mt-4">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                  disabled={isLoading}
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Task Management */}
            {selectedProject && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  📋 Tasks
                  <span className="ml-2 text-xs bg-gray-700 px-2 py-1 rounded">
                    {tasks.length}
                  </span>
                </h2>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Task name"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                  />
                  <textarea
                    placeholder="Task description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Assignee"
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                  />
                  <button
                    onClick={createTask}
                    disabled={isLoading || !newTaskName.trim() || uploadedFiles.length === 0}
                    className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➕ Create Task ({uploadedFiles.length} images)
                  </button>
                </div>

                <div className="mt-4">
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                    disabled={isLoading}
                  >
                    <option value="">Select Task</option>
                    {tasks.map(task => (
                      <option key={task.id} value={task.id}>
                        {task.name} ({task.images?.length || 0} images)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Image Navigation */}
            {selectedTask && tasks.find(t => t.id === selectedTask)?.images?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">🖼️ Image Navigation</h2>
                
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                    disabled={currentImageIndex === 0}
                    className="bg-gray-800 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ⬅️ Previous
                  </button>
                  <span className="text-sm text-gray-400">
                    {currentImageIndex + 1} / {tasks.find(t => t.id === selectedTask)?.images?.length || 0}
                  </span>
                  <button
                    onClick={() => setCurrentImageIndex(Math.min((tasks.find(t => t.id === selectedTask)?.images?.length || 1) - 1, currentImageIndex + 1))}
                    disabled={currentImageIndex >= (tasks.find(t => t.id === selectedTask)?.images?.length || 1) - 1}
                    className="bg-gray-800 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next ➡️
                  </button>
                </div>
                
                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    onClick={undoLastAnnotation}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                  >
                    ↶ Undo (Ctrl+Z)
                  </button>
                  <button
                    onClick={clearAnnotations}
                    className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                  >
                    🗑️ Clear All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Content - Enhanced Annotation Canvas */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-900 border border-red-800 text-red-200 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {selectedTask && getCurrentImageUrl() ? (
              <div className="space-y-6">
                {/* Annotation Canvas */}
                <div className="relative">
                  <AnnotationCanvas
                    imageUrl={getCurrentImageUrl()}
                    annotations={getCurrentImageAnnotations()}
                    labels={labels}
                    selectedLabel={selectedLabel}
                    onAnnotationsChange={handleAnnotationsChange}
                    onLabelSelect={setSelectedLabel}
                    isProcessing={isLoading}
                    zoomLevel={zoomLevel}
                    gridEnabled={gridEnabled}
                    snapToGrid={snapToGrid}
                  />
                  
                  {/* Canvas Controls Overlay */}
                  <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setZoomLevel(prev => Math.max(prev / 1.2, 0.1))}
                          className="bg-gray-700 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                        >
                          ➖
                        </button>
                        <span className="text-xs">{Math.round(zoomLevel * 100)}%</span>
                        <button
                          onClick={() => setZoomLevel(prev => Math.min(prev * 1.2, 5))}
                          className="bg-gray-700 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                        >
                          ➕
                        </button>
                        <button
                          onClick={() => setZoomLevel(1)}
                          className="bg-gray-700 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Annotation Summary */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📊 Current Image Annotations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCurrentImageAnnotations().map(annotation => {
                      const label = labels.find(l => l.id === annotation.labelId);
                      return (
                        <div key={annotation.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: label?.color || '#ffffff' }}
                            />
                            <span className="text-white font-medium">{label?.name || 'Unknown'}</span>
                            {annotation.confidence && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                {Math.round(annotation.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            Type: {annotation.type}
                          </div>
                          <div className="text-sm text-gray-400">
                            Points: {annotation.coordinates.length}
                          </div>
                          {annotation.reviewStatus && (
                            <div className="text-xs mt-2">
                              <span className={`px-2 py-1 rounded ${
                                annotation.reviewStatus === 'approved' ? 'bg-green-600' :
                                annotation.reviewStatus === 'rejected' ? 'bg-red-600' :
                                annotation.reviewStatus === 'needs_revision' ? 'bg-yellow-600' :
                                'bg-gray-600'
                              } text-white`}>
                                {annotation.reviewStatus}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                <div className="text-gray-400">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Ready to Annotate</h3>
                  <p className="text-gray-400">
                    Select a project and task to start annotating images
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Professional Feature Panels */}
      {showStats && (
        <AnnotationStats 
          onClose={() => setShowStats(false)}
          selectedProject={selectedProject}
          selectedTask={selectedTask}
        />
      )}
      
      {showCollaboration && (
        <CollaborationPanel 
          onClose={() => setShowCollaboration(false)}
          selectedTask={selectedTask}
        />
      )}
      
      {showQualityControl && (
        <QualityControl 
          onClose={() => setShowQualityControl(false)}
          selectedTask={selectedTask}
          annotations={getCurrentImageAnnotations()}
        />
      )}
      
      {showCVATIntegration && (
        <CVATIntegration 
          onClose={() => setShowCVATIntegration(false)}
          selectedProject={selectedProject}
          selectedTask={selectedTask}
          onTaskCreated={() => {
            setShowCVATIntegration(false);
            loadTasks(selectedProject);
          }}
        />
      )}
    </div>
  );
};
