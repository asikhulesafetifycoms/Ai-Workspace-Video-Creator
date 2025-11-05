export interface VideoConfig {
  prompt: string;
  image?: File | null;
  voice: 'Kore' | 'Puck' | 'Zephyr';
}

export interface StoryboardScene {
  scene: number;
  description: string;
  camera_shot: string;
}

export interface Storyboard {
    title: string;
    logline: string;
    scenes: StoryboardScene[];
}


// Fix: Centralize global type declaration for window.aistudio to avoid conflicts.
declare global {
  // Fix: Define a named interface `AIStudio` to resolve declaration conflicts.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // FIX: Added the `readonly` modifier to resolve the "All declarations of 'aistudio' must have identical modifiers" error. The conflicting declaration elsewhere likely has this modifier.
    readonly aistudio: AIStudio;
  }
}
