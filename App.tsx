
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ApiKeySelector } from './components/ApiKeySelector';
import { PromptForm } from './components/PromptForm';
import { LoadingIndicator } from './components/LoadingIndicator';
import { VideoPlayer } from './components/VideoPlayer';
import { generateStoryboard, generateSpeech, generateImage } from './services/geminiService';
import { VideoConfig, Storyboard } from './types';

function App() {
  // Fix: Initialize with isCheckingKey=true to ensure API key is checked on load.
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<React.ReactNode | null>(null);

  const checkApiKey = useCallback(async () => {
    try {
      setIsCheckingKey(true);
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeySelected(hasKey);
    } catch (e) {
      console.error("Error checking for API key:", e);
      setIsKeySelected(false);
    } finally {
      setIsCheckingKey(false);
    }
  }, []);

  // Fix: Add useEffect to check for API key when the component mounts.
  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleKeySelected = () => {
    // Fix: Re-check the key to be certain, instead of just assuming it's selected.
    checkApiKey();
  };

  const handleGenerateVideo = async (config: VideoConfig) => {
    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      // Step 1: Generate the storyboard/script
      setLoadingMessage("AI is drafting the script...");
      const storyboard = await generateStoryboard(config);
      const totalScenes = storyboard.scenes.length;

      // Step 2: Generate all audio files first.
      const audioAssets: { scene: Storyboard['scenes'][0], audioBlob: Blob }[] = [];
      setLoadingMessage(`Generating voiceovers for ${totalScenes} scenes...`);
      for (let i = 0; i < totalScenes; i++) {
        const scene = storyboard.scenes[i];
        setLoadingMessage(`Generating voiceover for scene ${i + 1}/${totalScenes}`);
        const audioBlob = await generateSpeech(scene.description, config.voice);
        audioAssets.push({ scene, audioBlob });
      }

      // Step 3: Generate all images with significant delays between each call.
      const sceneAssets = [];
      setLoadingMessage(`Generating visuals for ${totalScenes} scenes...`);
      for (let i = 0; i < totalScenes; i++) {
        const { scene, audioBlob } = audioAssets[i];

        // Pause before each image generation call to respect rate limits.
        const delaySeconds = 65;
        for (let s = delaySeconds; s > 0; s--) {
            setLoadingMessage(`Pausing to respect API rate limits... Resuming image generation in ${s} seconds.`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setLoadingMessage(`Generating visual for scene ${i + 1}/${totalScenes}`);
        const imageUrl = await generateImage(`${storyboard.title}: ${scene.description}`);
        
        sceneAssets.push({ ...scene, audioBlob, imageUrl });
      }


      // Step 4: Assemble the video in the browser
      setLoadingMessage("Assembling the final video with transitions...");
      const finalVideoUrl = await assembleVideo(storyboard, sceneAssets);
      setVideoUrl(finalVideoUrl);

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || err.toString() || "An unknown error occurred.";

      if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("rate limit")) {
         setError(
            <>
              The AI API is currently busy (rate limit exceeded). This is a temporary limitation of the free tier. 
              Please wait for a minute and try your request again.
            </>
          );
      } else if (errorMessage.includes("API key not found") || errorMessage.includes("Requested entity was not found.")) {
         setError("Please select a Google AI API key to use the Gemini API.");
         setIsKeySelected(false);
      } else if (errorMessage.includes("only accessible to billed users")) {
        setError(<>
          The Image Generation API requires a billed account. Please{' '}
          <a href="https://cloud.google.com/billing/docs/how-to/modify-project" target="_blank" rel="noopener noreferrer" className="font-bold underline">
            enable billing for your Google Cloud project
          </a>
          {' '}and try again.
        </>);
      }
      else {
        setError(`Failed to generate video: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const assembleVideo = (storyboard: Storyboard, assets: any[]): Promise<string> => {
      return new Promise(async (resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return reject('Could not get canvas context');

        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        const chunks: Blob[] = [];
        recorder.ondataavailable = e => e.data.size > 0 && chunks.push(e.data);
        recorder.onstop = () => resolve(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })));
        recorder.onerror = (e) => reject(`MediaRecorder error: ${e}`);

        const wrapText = (text: string, maxWidth: number): string[] => {
            ctx.font = '32px sans-serif';
            const words = text.split(' ');
            let lines: string[] = [];
            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = ctx.measureText(currentLine + " " + word).width;
                if (width < maxWidth) {
                    currentLine += " " + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            return lines.slice(0, 3); // Max 3 lines
        }

        const drawFrame = (image: HTMLImageElement, textLines: string[], title: string = '') => {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            if (title) {
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                const titleLines = wrapText(title, canvas.width - 200);
                const rectHeight = titleLines.length * 70 + 40;
                ctx.fillRect(0, (canvas.height - rectHeight) / 2, canvas.width, rectHeight);
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 52px sans-serif';
                titleLines.forEach((line, index) => {
                    ctx.fillText(line, canvas.width / 2, canvas.height / 2 - (titleLines.length-1)*35 + (index * 70));
                });

            } else if (textLines.length > 0) {
                ctx.textAlign = 'left';
                const textBlockHeight = textLines.length * 40 + 40;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, canvas.height - textBlockHeight - 20, canvas.width, textBlockHeight);
                ctx.fillStyle = 'white';
                ctx.font = '32px sans-serif';
                textLines.forEach((line, index) => {
                  ctx.fillText(line, 40, canvas.height - textBlockHeight + (index * 40) + 15);
                });
            }
        };

        const fadeTransition = async (type: 'in' | 'out', duration: number = 300) => {
            const steps = 30;
            for (let i = 0; i < steps; i++) {
                const alpha = type === 'out' ? i / steps : 1 - (i / steps);
                ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                await new Promise(r => setTimeout(r, duration / steps));
            }
        };

        recorder.start();
        
        const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.crossOrigin = 'anonymous';
            img.src = src;
        });

        // --- Title Frame ---
        const titleImage = await loadImage(assets[0].imageUrl);
        drawFrame(titleImage, [], storyboard.title);
        await new Promise(r => setTimeout(r, 3000));

        // --- Scene Frames ---
        for (const asset of assets) {
            await fadeTransition('out');
            const image = await loadImage(asset.imageUrl);
            const audio = new Audio(URL.createObjectURL(asset.audioBlob));
            
            const textLines = wrapText(asset.description, canvas.width - 80);
            
            const audioPromise = new Promise<void>(resolve => audio.onended = () => resolve());
            
            let frameRequest: number;
            const renderLoop = () => {
                drawFrame(image, textLines);
                frameRequest = requestAnimationFrame(renderLoop);
            };
            
            // Wait for fade in before starting audio and render loop
            drawFrame(image, textLines); // Draw first frame immediately
            await fadeTransition('in');

            audio.play();
            renderLoop();
            
            await audioPromise;
            cancelAnimationFrame(frameRequest);
        }

        await fadeTransition('out');
        recorder.stop();
      });
  };

  const reset = () => {
    setVideoUrl(null);
    setError(null);
  };

  const renderContent = () => {
    if (isCheckingKey) {
      return <div className="text-white text-center">Checking for API Key...</div>;
    }
    if (!isKeySelected) {
      return <ApiKeySelector onKeySelected={handleKeySelected} />;
    }
    if (isLoading) {
      return <LoadingIndicator message={loadingMessage} />;
    }
    if (videoUrl) {
      return <VideoPlayer videoUrl={videoUrl} onReset={reset} />;
    }
    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white">AI Workspace Video Creator</h1>
                <p className="mt-2 text-lg text-gray-400">Turn your ideas into professional videos in seconds.</p>
            </div>
            {error && (
                <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
                <PromptForm onSubmit={handleGenerateVideo} isLoading={isLoading} />
            </div>
        </div>
    );
  };

  return (
    <main className="bg-gray-900 min-h-screen text-white flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
        <div className="w-full max-w-2xl">
            {renderContent()}
        </div>
    </main>
  );
}

export default App;
