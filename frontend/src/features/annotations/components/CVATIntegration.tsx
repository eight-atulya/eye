'use client';

import { useState, useEffect } from 'react';

interface CVATIntegrationProps {
  onClose: () => void;
  selectedProject: string;
  selectedTask: string;
  onTaskCreated: () => void;
}

export const CVATIntegration = ({ 
  onClose, 
  selectedProject, 
  selectedTask, 
  onTaskCreated 
}: CVATIntegrationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cvatProjects, setCvatProjects] = useState<any[]>([]);
  const [cvatTasks, setCvatTasks] = useState<any[]>([]);
  const [selectedCvatProject, setSelectedCvatProject] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [assignee, setAssignee] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [labels, setLabels] = useState<any[]>([]);

  useEffect(() => {
    loadCvatProjects();
  }, []);

  const loadCvatProjects = async () => {
    try {
      setIsLoading(true);
      // This would load CVAT projects from the backend
      // For now, we'll use mock data
      setCvatProjects([
        { id: '1', name: 'Object Detection Project', status: 'active' },
        { id: '2', name: 'Segmentation Project', status: 'active' }
      ]);
    } catch (err) {
      setError('Failed to load CVAT projects');
    } finally {
      setIsLoading(false);
    }
  };

  const createCvatProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('project_name', newProjectName);
      formData.append('description', newProjectDescription);
      formData.append('labels_json', JSON.stringify(labels));

      const response = await fetch('http://localhost:8001/api/v1/annotations/cvat/projects', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setSuccess('CVAT project created successfully');
        setNewProjectName('');
        setNewProjectDescription('');
        setShowCreateProject(false);
        loadCvatProjects();
      } else {
        setError('Failed to create CVAT project');
      }
    } catch (err) {
      setError('Failed to create CVAT project');
    } finally {
      setIsLoading(false);
    }
  };

  const createCvatTask = async () => {
    if (!taskName.trim() || !selectedCvatProject || uploadedFiles.length === 0) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('project_id', selectedCvatProject);
      formData.append('task_name', taskName);
      formData.append('description', taskDescription);
      formData.append('assignee', assignee);
      
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('http://localhost:8001/api/v1/annotations/cvat/tasks', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setSuccess('CVAT task created successfully');
        setTaskName('');
        setTaskDescription('');
        setUploadedFiles([]);
        setAssignee('');
        onTaskCreated();
      } else {
        setError('Failed to create CVAT task');
      }
    } catch (err) {
      setError('Failed to create CVAT task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(files);
  };

  const addLabel = () => {
    const newLabel = {
      id: Date.now().toString(),
      name: '',
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      category: 'object'
    };
    setLabels([...labels, newLabel]);
  };

  const updateLabel = (index: number, field: string, value: string) => {
    const updatedLabels = [...labels];
    updatedLabels[index] = { ...updatedLabels[index], [field]: value };
    setLabels(updatedLabels);
  };

  const removeLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">🔗 CVAT Integration</h2>
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

        {success && (
          <div className="bg-green-900 border border-green-800 text-green-200 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create CVAT Project */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">📁 Create CVAT Project</h3>
            
            {!showCreateProject ? (
              <button
                onClick={() => setShowCreateProject(true)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
              >
                ➕ New CVAT Project
              </button>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                />
                <textarea
                  placeholder="Project description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                  rows={3}
                />
                
                {/* Labels */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-300">Labels</label>
                    <button
                      onClick={addLabel}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      ➕ Add Label
                    </button>
                  </div>
                  <div className="space-y-2">
                    {labels.map((label, index) => (
                      <div key={label.id} className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={label.color}
                          onChange={(e) => updateLabel(index, 'color', e.target.value)}
                          className="w-8 h-8 rounded border border-gray-600"
                        />
                        <input
                          type="text"
                          placeholder="Label name"
                          value={label.name}
                          onChange={(e) => updateLabel(index, 'name', e.target.value)}
                          className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                        />
                        <select
                          value={label.category}
                          onChange={(e) => updateLabel(index, 'category', e.target.value)}
                          className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                        >
                          <option value="object">Object</option>
                          <option value="segmentation">Segmentation</option>
                          <option value="keypoint">Keypoint</option>
                          <option value="mask">Mask</option>
                        </select>
                        <button
                          onClick={() => removeLabel(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={createCvatProject}
                    disabled={isLoading || !newProjectName.trim()}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    onClick={() => setShowCreateProject(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded font-medium hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Create CVAT Task */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">📋 Create CVAT Task</h3>
            
            <div className="space-y-4">
              <select
                value={selectedCvatProject}
                onChange={(e) => setSelectedCvatProject(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                disabled={isLoading}
              >
                <option value="">Select CVAT Project</option>
                {cvatProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Task name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
              />

              <textarea
                placeholder="Task description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                rows={3}
              />

              <input
                type="text"
                placeholder="Assignee (optional)"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
              />

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
              />

              <button
                onClick={createCvatTask}
                disabled={isLoading || !taskName.trim() || !selectedCvatProject || uploadedFiles.length === 0}
                className="w-full bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : `Create Task (${uploadedFiles.length} images)`}
              </button>
            </div>
          </div>
        </div>

        {/* CVAT Integration Info */}
        <div className="mt-6 bg-blue-900 border border-blue-800 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-200 mb-2">🔗 CVAT Integration Features</h4>
          <div className="text-blue-300 text-sm space-y-1">
            <div>• Seamless sync between EYE and CVAT platforms</div>
            <div>• Professional annotation tools and workflows</div>
            <div>• Team collaboration and task assignment</div>
            <div>• Advanced export formats (COCO, YOLO, Pascal VOC)</div>
            <div>• Quality control and review processes</div>
            <div>• Real-time progress tracking</div>
          </div>
        </div>

        {/* CVAT Access */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Access CVAT directly at: <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">http://localhost:8080</a>
          </div>
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
