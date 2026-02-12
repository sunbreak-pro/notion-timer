import { createContext } from 'react';
import type { SoundMixerState } from '../hooks/useLocalSoundMixer';

export interface AudioStateContextValue {
  mixer: SoundMixerState;
  channelPositions: Record<string, { currentTime: number; duration: number }>;
  workscreenSelections: string[];
  isWorkscreenSelected: (soundId: string) => boolean;
}

export const AudioStateContext = createContext<AudioStateContextValue | null>(null);
