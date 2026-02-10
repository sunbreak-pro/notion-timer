import { createContext } from 'react';
import type { SoundMixerState } from '../hooks/useLocalSoundMixer';
import type { CustomSoundMeta } from '../types/customSound';

export interface AudioContextValue {
  mixer: SoundMixerState;
  toggleSound: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  customSounds: CustomSoundMeta[];
  addSound: (file: File) => Promise<{ error?: string }>;
  removeSound: (id: string) => Promise<void>;
}

export const AudioContext = createContext<AudioContextValue | null>(null);
