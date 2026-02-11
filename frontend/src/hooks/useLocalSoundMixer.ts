import { useState, useCallback, useEffect } from 'react';
import { SOUND_TYPES } from '../constants/sounds';
import { getDataService } from '../services';

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

export function useLocalSoundMixer(customSoundIds: string[] = []) {
  const [mixer, setMixer] = useState<SoundMixerState>(getDefaultMixerState);

  // Add custom sound entries to mixer when they don't exist yet
  useEffect(() => {
    if (customSoundIds.length === 0) return;
    setMixer(prev => {
      let changed = false;
      const next = { ...prev };
      for (const id of customSoundIds) {
        if (!next[id]) {
          next[id] = { enabled: false, volume: 50 };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [customSoundIds]);

  // Load from DataService on mount
  useEffect(() => {
    let cancelled = false;
    getDataService().fetchSoundSettings()
      .then((settings) => {
        if (cancelled || settings.length === 0) return;
        setMixer(prev => {
          const next = { ...prev };
          for (const s of settings) {
            next[s.soundType] = { enabled: s.enabled, volume: s.volume };
          }
          return next;
        });
      })
      .catch((e) => console.warn('[Sound] fetch settings:', e.message));
    return () => { cancelled = true; };
  }, []);

  const toggleSound = useCallback((id: string) => {
    setMixer(prev => {
      const current = prev[id];
      const newEnabled = !current.enabled;
      getDataService().updateSoundSetting(id, current.volume, newEnabled)
        .catch((e) => console.warn('[Sound] sync:', e.message));
      return { ...prev, [id]: { ...current, enabled: newEnabled } };
    });
  }, []);

  const setVolume = useCallback((id: string, volume: number) => {
    setMixer(prev => {
      const current = prev[id];
      getDataService().updateSoundSetting(id, volume, current.enabled)
        .catch((e) => console.warn('[Sound] sync:', e.message));
      return { ...prev, [id]: { ...current, volume } };
    });
  }, []);

  return { mixer, toggleSound, setVolume };
}
