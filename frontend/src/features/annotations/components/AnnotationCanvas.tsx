'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// Types
interface Point {
  x: number;
  y: number;
}

interface Annotation {
  id: string;
  labelId: string;
  type: 'bbox' | 'polygon' | 'point';
  coordinates: Point[];
  confidence?: number;
  attributes: Record<string, any>;
}

interface Label {
  id: string;
  name: string;
  color: string;
  category: string;
}

interface AnnotationCanvasProps {
  imageUrl: string;
  annotations: Annotation[];
  labels: Label[];
  selectedLabel: string;
  onAnnotationsChange: (annotations: Annotation[]) => void;
  onLabelSelect: (labelId: string) => void;
  isProcessing?: boolean;
  zoomLevel?: number;
  gridEnabled?: boolean;
  snapToGrid?: boolean;
}

export const AnnotationCanvas = ({
  imageUrl,
  annotations,
  labels,
  selectedLabel,
  onAnnotationsChange,
  onLabelSelect,
  isProcessing = false,
  zoomLevel = 1,
  gridEnabled = false,
  snapToGrid = false
}: AnnotationCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [annotationMode, setAnnotationMode] = useState<'bbox' | 'polygon' | 'point'>('bbox');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Load image and calculate dimensions
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setImageLoaded(true);
        
        // Calculate scale to fit canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const canvasRect = canvas.getBoundingClientRect();
          const scaleX = canvasRect.width / img.width;
          const scaleY = canvasRect.height / img.height;
          const newScale = Math.min(scaleX, scaleY, 1);
          setScale(newScale);
          
          // Center the image
          const scaledWidth = img.width * newScale;
          const scaledHeight = img.height * newScale;
          setOffset({
            x: (canvasRect.width - scaledWidth) / 2,
            y: (canvasRect.height - scaledHeight) / 2
          });
        }
      };
      img.src = imageUrl;
      imageRef.current = img;
    }
  }, [imageUrl]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    const img = imageRef.current;
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    
    ctx.drawImage(img, offset.x, offset.y, scaledWidth, scaledHeight);

    // Draw existing annotations
    annotations.forEach(annotation => {
      const label = labels.find(l => l.id === annotation.labelId);
      if (!label) return;

      ctx.strokeStyle = label.color;
      ctx.fillStyle = label.color + '40'; // Add transparency
      ctx.lineWidth = 2;

      if (annotation.type === 'bbox' && annotation.coordinates.length >= 2) {
        const start = annotation.coordinates[0];
        const end = annotation.coordinates[1];
        const x = Math.min(start.x, end.x) * scale + offset.x;
        const y = Math.min(start.y, end.y) * scale + offset.y;
        const width = Math.abs(end.x - start.x) * scale;
        const height = Math.abs(end.y - start.y) * scale;

        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);

        // Draw label
        ctx.fillStyle = label.color;
        ctx.font = '14px Arial';
        ctx.fillText(label.name, x, y - 5);
      } else if (annotation.type === 'polygon' && annotation.coordinates.length >= 3) {
        ctx.beginPath();
        annotation.coordinates.forEach((point, index) => {
          const x = point.x * scale + offset.x;
          const y = point.y * scale + offset.y;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw label
        ctx.fillStyle = label.color;
        ctx.font = '14px Arial';
        const firstPoint = annotation.coordinates[0];
        ctx.fillText(label.name, firstPoint.x * scale + offset.x, firstPoint.y * scale + offset.y - 5);
      } else if (annotation.type === 'point' && annotation.coordinates.length >= 1) {
        const point = annotation.coordinates[0];
        const x = point.x * scale + offset.x;
        const y = point.y * scale + offset.y;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw label
        ctx.fillStyle = label.color;
        ctx.font = '14px Arial';
        ctx.fillText(label.name, x + 10, y - 5);
      }
    });

    // Draw current annotation being created
    if (currentAnnotation && currentAnnotation.coordinates.length > 0) {
      const label = labels.find(l => l.id === currentAnnotation.labelId);
      if (label) {
        ctx.strokeStyle = label.color;
        ctx.fillStyle = label.color + '40';
        ctx.lineWidth = 2;

        if (currentAnnotation.type === 'bbox' && currentAnnotation.coordinates.length >= 1) {
          const start = currentAnnotation.coordinates[0];
          const x = start.x * scale + offset.x;
          const y = start.y * scale + offset.y;
          
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(x, y, 0, 0);
          ctx.setLineDash([]);
        } else if (currentAnnotation.type === 'polygon') {
          ctx.beginPath();
          currentAnnotation.coordinates.forEach((point, index) => {
            const x = point.x * scale + offset.x;
            const y = point.y * scale + offset.y;
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        } else if (currentAnnotation.type === 'point') {
          const point = currentAnnotation.coordinates[0];
          const x = point.x * scale + offset.x;
          const y = point.y * scale + offset.y;

          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  }, [annotations, labels, currentAnnotation, imageLoaded, scale, offset]);

  // Redraw when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Get mouse position relative to image
  const getImagePosition = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - offset.x) / scale;
    const y = (event.clientY - rect.top - offset.y) / scale;

    return { x: Math.max(0, Math.min(x, imageDimensions.width)), y: Math.max(0, Math.min(y, imageDimensions.height)) };
  };

  // Mouse event handlers
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isProcessing || !selectedLabel) return;

    const position = getImagePosition(event);
    setIsDrawing(true);

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      labelId: selectedLabel,
      type: annotationMode,
      coordinates: [position],
      attributes: {}
    };

    setCurrentAnnotation(newAnnotation);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || isProcessing) return;

    const position = getImagePosition(event);

    if (annotationMode === 'bbox' && currentAnnotation.coordinates.length === 1) {
      setCurrentAnnotation({
        ...currentAnnotation,
        coordinates: [currentAnnotation.coordinates[0], position]
      });
    } else if (annotationMode === 'polygon') {
      setCurrentAnnotation({
        ...currentAnnotation,
        coordinates: [...currentAnnotation.coordinates.slice(0, -1), position]
      });
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || isProcessing) return;

    const position = getImagePosition(event);

    if (annotationMode === 'bbox') {
      if (currentAnnotation.coordinates.length === 1) {
        setCurrentAnnotation({
          ...currentAnnotation,
          coordinates: [currentAnnotation.coordinates[0], position]
        });
      }
      // Complete bbox annotation
      onAnnotationsChange([...annotations, currentAnnotation]);
      setCurrentAnnotation(null);
    } else if (annotationMode === 'point') {
      onAnnotationsChange([...annotations, currentAnnotation]);
      setCurrentAnnotation(null);
    }
    // For polygon, continue adding points on click

    setIsDrawing(false);
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (annotationMode === 'polygon' && currentAnnotation && currentAnnotation.coordinates.length >= 3) {
      // Complete polygon annotation
      onAnnotationsChange([...annotations, currentAnnotation]);
      setCurrentAnnotation(null);
      setIsDrawing(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setCurrentAnnotation(null);
      setIsDrawing(false);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      // Delete last annotation
      if (annotations.length > 0) {
        onAnnotationsChange(annotations.slice(0, -1));
      }
    }
  };

  return (
    <div className="relative bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{ outline: 'none' }}
      />

      {/* Overlay Controls */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium">Annotation Mode:</label>
            <select
              value={annotationMode}
              onChange={(e) => setAnnotationMode(e.target.value as 'bbox' | 'polygon' | 'point')}
              className="ml-2 bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
              disabled={isProcessing}
            >
              <option value="bbox">Bounding Box</option>
              <option value="polygon">Polygon</option>
              <option value="point">Point</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Label:</label>
            <select
              value={selectedLabel}
              onChange={(e) => onLabelSelect(e.target.value)}
              className="ml-2 bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
              disabled={isProcessing}
            >
              <option value="">Select Label</option>
              {labels.map(label => (
                <option key={label.id} value={label.id} style={{ color: label.color }}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-gray-300">
            <div>• Click and drag to create bounding box</div>
            <div>• Click to add polygon points, double-click to finish</div>
            <div>• Click to place point</div>
            <div>• ESC to cancel, Delete to remove last</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded">
        <div className="text-sm">
          {imageLoaded ? (
            <>
              <div>Image: {imageDimensions.width} × {imageDimensions.height}</div>
              <div>Annotations: {annotations.length}</div>
              {currentAnnotation && (
                <div>Drawing: {currentAnnotation.type}</div>
              )}
            </>
          ) : (
            <div>Loading image...</div>
          )}
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 text-white p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
