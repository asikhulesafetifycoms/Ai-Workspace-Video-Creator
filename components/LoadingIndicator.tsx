
import React from 'react';

interface LoadingIndicatorProps {
  message: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-semibold text-white mb-2">AI is working its magic...</h2>
      <p className="text-gray-300 max-w-sm animate-pulse">{message}</p>
    </div>
  );
};
