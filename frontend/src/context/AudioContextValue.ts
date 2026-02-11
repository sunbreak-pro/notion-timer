import { createContext } from 'react';
import type { SoundMixerState } from '../hooks/useLocalSoundMixer';
import type { CustomSoundMeta } from '../types/customSound';
import type { WorkscreenSelections } from '../hooks/useWorkscreenSelections';

export interface AudioContextValue {
  mixer: SoundMixerState;
  toggleSound: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  workMixer: SoundMixerState;
  restMixer: SoundMixerState;
  toggleWorkSound: (id: string) => void;
  toggleRestSound: (id: string) => void;
  setWorkVolume: (id: string, volume: number) => void;
  setRestVolume: (id: string, volume: number) => void;
  customSounds: CustomSoundMeta[];
  addSound: (file: File) => Promise<{ error?: string }>;
  removeSound: (id: string) => Promise<void>;
  setMixerOverride: (type: 'WORK' | 'REST' | null) => void;
  resetAllPlayback: () => void;
  seekSound: (id: string, time: number) => void;
  channelPositions: Record<string, { currentTime: number; duration: number }>;
  workscreenSelections: WorkscreenSelections;
}

export const AudioContext = createContext<AudioContextValue | null>(null);
