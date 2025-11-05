
import React from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Assume success and let the parent component re-check and re-render.
      onKeySelected();
    } catch (e) {
      console.error("Error opening API key selection dialog:", e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-lg p-8 text-center border border-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6.364-3.636l-1.414 1.414M20.364 13.364l-1.414-1.414M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-2xl font-bold mb-2">API Key Required</h1>
        <p className="text-gray-400 mb-6">
          To use the AI Video Creator, you need to select a Google AI API key. This will be used to process your video generation requests.
        </p>
        <button
          onClick={handleSelectKey}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Select Your API Key
        </button>
        <p className="text-xs text-gray-500 mt-4">
          Video generation may incur costs. Please review the{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            billing documentation
          </a>{' '}
          for details.
        </p>
      </div>
    </div>
  );
};
