import { GoogleGenAI, Type, Part, Modality } from "@google/genai";
import { Storyboard, VideoConfig } from '../types';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

function getApiKey() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API key not found. Please select a Google AI API key.");
  }
  return apiKey;
}

export async function generateStoryboard(
  config: Pick<VideoConfig, 'prompt' | 'image'>
): Promise<Storyboard> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const parts: Part[] = [{ text: `Generate a script for a short professional video about: ${config.prompt}` }];

  if (config.image) {
    const base64Data = await fileToBase64(config.image);
    parts.unshift({
      inlineData: {
        mimeType: config.image.type,
        data: base64Data,
      },
    });
  }

  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: parts },
      config: {
          systemInstruction: `You are a scriptwriter for corporate and educational videos. Based on the user's prompt, generate a script. Provide a short, catchy title, a 1-sentence logline, and a sequence of 3 to 5 scenes. For each scene, provide a concise description for a voiceover narrator. The tone should be professional, clear, and engaging.`,
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  title: { type: Type.STRING },
                  logline: { type: Type.STRING },
                  scenes: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              scene: { type: Type.INTEGER },
                              description: { type: Type.STRING },
                              camera_shot: { type: Type.STRING, description: "A suggested visual style, e.g., 'Clean corporate graphic', 'Abstract background', 'Product mockup'" },
                          },
                          required: ["scene", "description", "camera_shot"],
                      },
                  },
              },
              required: ["title", "logline", "scenes"],
          },
      },
  });
  
  const storyboard = JSON.parse(response.text);
  return storyboard;
}

export async function generateSpeech(text: string, voiceName: 'Kore' | 'Puck' | 'Zephyr'): Promise<Blob> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Audio data not found in response.");
    }
    
    // Fix: The Gemini API returns raw PCM audio data. To make it playable in a browser
    // using standard HTML5 audio, it must be wrapped in a container format like WAV.
    // This code decodes the base64 audio and adds a proper WAV header.
    const binaryString = atob(base64Audio);
    const pcmData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        pcmData[i] = binaryString.charCodeAt(i);
    }

    const sampleRate = 24000; // Gemini TTS uses a 24kHz sample rate.
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const headerSize = 44;
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(buffer);
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size for PCM
    view.setUint16(20, 1, true);  // AudioFormat for PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM data
    pcmData.forEach((byte, index) => {
        view.setUint8(headerSize + index, byte);
    });

    return new Blob([view], { type: 'audio/wav' });
}

export async function generateImage(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{
                text: `Generate a visually appealing, professional, and minimalist background image suitable for a corporate presentation slide. The image should be abstract and subtly related to the topic: "${prompt}". It must not contain any text or legible words. The style should be clean, modern, and uncluttered. Aspect ratio 16:9.`
            }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Image data not found in response.");
}
