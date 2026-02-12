import { createContext } from 'react';
import type { SoundMixerState } from '../hooks/useLocalSoundMixer';
import type { WorkscreenSelections } from '../hooks/useWorkscreenSelections';

export interface AudioStateContextValue {
  mixer: SoundMixerState;
  workMixer: SoundMixerState;
  restMixer: SoundMixerState;
  channelPositions: Record<string, { currentTime: number; duration: number }>;
  workscreenSelections: WorkscreenSelections;
  isWorkscreenSelected: (soundId: string, category: 'WORK' | 'REST') => boolean;
}

export const AudioStateContext = createContext<AudioStateContextValue | null>(null);
