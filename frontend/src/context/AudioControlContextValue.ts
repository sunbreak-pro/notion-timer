import { createContext } from 'react';
import type { CustomSoundMeta } from '../types/customSound';

export interface AudioControlContextValue {
  toggleSound: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  toggleWorkSound: (id: string) => void;
  toggleRestSound: (id: string) => void;
  setWorkVolume: (id: string, volume: number) => void;
  setRestVolume: (id: string, volume: number) => void;
  addSound: (file: File) => Promise<{ error?: string }>;
  removeSound: (id: string) => Promise<void>;
  setMixerOverride: (type: 'WORK' | 'REST' | null) => void;
  resetAllPlayback: () => void;
  seekSound: (id: string, time: number) => void;
  customSounds: CustomSoundMeta[];
  toggleWorkscreenSelection: (soundId: string, category: 'WORK' | 'REST') => void;
}

export const AudioControlContext = createContext<AudioControlContextValue | null>(null);
