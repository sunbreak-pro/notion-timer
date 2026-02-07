import { useCallback } from 'react';
import { SOUND_TYPES } from '../constants/sounds';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useLocalStorage } from './useLocalStorage';

export interface SoundState {
  enabled: boolean;
  volume: number;
}

export type SoundMixerState = Record<string, SoundState>;

function getDefaultMixerState(): SoundMixerState {
  const initial: SoundMixerState = {};
  for (const s of SOUND_TYPES) {
    initial[s.id] = { enabled: false, volume: 50 };
  }
  return initial;
}

export function useLocalSoundMixer() {
  const [mixer, setMixer] = useLocalStorage<SoundMixerState>(
    STORAGE_KEYS.SOUND_MIXER,
    getDefaultMixerState()
  );

  const toggleSound = useCallback((id: string) => {
    setMixer(prev => ({ ...prev, [id]: { ...prev[id], enabled: !prev[id].enabled } }));
  }, [setMixer]);

  const setVolume = useCallback((id: string, volume: number) => {
    setMixer(prev => ({ ...prev, [id]: { ...prev[id], volume } }));
  }, [setMixer]);

  return { mixer, toggleSound, setVolume };
}
