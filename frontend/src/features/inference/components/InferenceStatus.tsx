'use client';

interface InferenceStatusProps {
  isProcessing: boolean;
  status: string;
}

export const InferenceStatus = ({ isProcessing, status }: InferenceStatusProps) => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Processing Status</h3>
      
      <div className="space-y-3">
        {/* Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-sm text-white">
            {isProcessing ? 'Processing' : 'Ready'}
          </span>
        </div>

        {/* Status Message */}
        {status && (
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-3">
            <p className="text-xs text-gray-300">{status}</p>
          </div>
        )}

        {/* Progress Bar (when processing) */}
        {isProcessing && (
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-white h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        )}

        {/* Processing Steps */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Image uploaded</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Processing with YOLO-E</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span>Generating results</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
