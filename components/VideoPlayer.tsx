import React from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  onReset: () => void;
}

const CreateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, onReset }) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center space-y-6 animate-fade-in">
        <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white">Your Video is Ready!</h1>
            <p className="mt-2 text-lg text-gray-400">Preview your generated video below.</p>
        </div>

      <div className="w-full bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        <video src={videoUrl} controls className="w-full aspect-video" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <a
          href={videoUrl}
          download="ai_generated_video.webm"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 transition-transform transform hover:scale-105"
        >
          <DownloadIcon />
          Download Video
        </a>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-transform transform hover:scale-105"
        >
          <CreateIcon />
          Create Another
        </button>
      </div>
    </div>
  );
};

// Add a simple fade-in animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
  }
`;
document.head.append(style);