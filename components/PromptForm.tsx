import React, { useState } from 'react';
import { VideoConfig } from '../types';

interface PromptFormProps {
  onSubmit: (config: VideoConfig) => void;
  isLoading: boolean;
}

const GenerateIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);

export const PromptForm: React.FC<PromptFormProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [voice, setVoice] = useState<VideoConfig['voice']>('Zephyr');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const removeImage = () => {
      setImage(null);
      setImagePreview(null);
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert("Please enter a prompt for your video.");
      return;
    }
    onSubmit({ prompt, image, voice });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
          Describe your video topic
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A quarterly business review highlighting our key achievements."
          className="w-full h-32 p-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          disabled={isLoading}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label htmlFor="voice" className="block text-sm font-medium text-gray-300 mb-2">
              Voiceover Style
            </label>
            <select
              id="voice"
              value={voice}
              onChange={(e) => setVoice(e.target.value as VideoConfig['voice'])}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={isLoading}
            >
              <option value="Zephyr">Zephyr (Male)</option>
              <option value="Kore">Kore (Female)</option>
              <option value="Puck">Puck (Male)</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Reference Image (Optional)</label>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700">
                    {imagePreview ? (
                        <div className="relative group w-full h-full">
                            <img src={imagePreview} alt="Preview" className="object-cover w-full h-full rounded-md" />
                            <button type="button" onClick={removeImage} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                            <p className="text-xs text-gray-400">Click to upload</p>
                        </div>
                    )}
                    <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" disabled={isLoading} />
                </label>
            </div> 
        </div>
      </div>


      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center items-center p-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
      >
        <GenerateIcon />
        {isLoading ? 'Generating Video...' : 'Generate Video'}
      </button>
    </form>
  );
};