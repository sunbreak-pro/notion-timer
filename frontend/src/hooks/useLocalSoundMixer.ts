import { useState, useCallback, useEffect } from 'react';
import { SOUND_TYPES } from '../constants/sounds';
import { getDataService } from '../services';
import { logServiceError } from '../utils/logError';

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

export function useLocalSoundMixer(customSoundIds: string[] = [], sessionCategory: string = 'WORK') {
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

  // Load from DataService on mount and when sessionCategory changes
  useEffect(() => {
    let cancelled = false;
    getDataService().fetchSoundSettings(sessionCategory)
      .then((settings) => {
        if (cancelled) return;
        setMixer(() => {
          const next = getDefaultMixerState();
          for (const id of customSoundIds) {
            if (!next[id]) next[id] = { enabled: false, volume: 50 };
          }
          for (const s of settings) {
            next[s.soundType] = { enabled: s.enabled, volume: s.volume };
          }
          return next;
        });
      })
      .catch((e) => logServiceError('Sound', 'fetchSettings', e));
    return () => { cancelled = true; };
  }, [sessionCategory, customSoundIds]);

  const toggleSound = useCallback((id: string) => {
    setMixer(prev => {
      const current = prev[id];
      const newEnabled = !current.enabled;
      getDataService().updateSoundSetting(id, current.volume, newEnabled, sessionCategory)
        .catch((e) => logServiceError('Sound', 'sync', e));
      return { ...prev, [id]: { ...current, enabled: newEnabled } };
    });
  }, [sessionCategory]);

  const setVolume = useCallback((id: string, volume: number) => {
    setMixer(prev => {
      const current = prev[id];
      getDataService().updateSoundSetting(id, volume, current.enabled, sessionCategory)
        .catch((e) => logServiceError('Sound', 'sync', e));
      return { ...prev, [id]: { ...current, volume } };
    });
  }, [sessionCategory]);

  return { mixer, toggleSound, setVolume };
}
