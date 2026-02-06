import { useState, useCallback } from 'react';
import { SOUND_TYPES } from '../constants/sounds';

export interface SoundState {
  enabled: boolean;
  volume: number;
}

export type SoundMixerState = Record<string, SoundState>;

const STORAGE_KEY = 'sonic-flow-sound-mixer';

function loadState(): SoundMixerState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch { /* fall through */ }
  }
  const initial: SoundMixerState = {};
  for (const s of SOUND_TYPES) {
    initial[s.id] = { enabled: false, volume: 50 };
  }
  return initial;
}

function saveState(state: SoundMixerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useLocalSoundMixer() {
  const [mixer, setMixer] = useState<SoundMixerState>(loadState);

  const toggleSound = useCallback((id: string) => {
    setMixer(prev => {
      const updated = { ...prev, [id]: { ...prev[id], enabled: !prev[id].enabled } };
      saveState(updated);
      return updated;
    });
  }, []);

  const setVolume = useCallback((id: string, volume: number) => {
    setMixer(prev => {
      const updated = { ...prev, [id]: { ...prev[id], volume } };
      saveState(updated);
      return updated;
    });
  }, []);

  return { mixer, toggleSound, setVolume };
}
