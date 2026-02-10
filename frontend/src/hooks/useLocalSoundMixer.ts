import { useCallback, useEffect, useRef } from 'react';
import { SOUND_TYPES } from '../constants/sounds';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useLocalStorage } from './useLocalStorage';
import * as soundApi from '../api/soundClient';

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
  const [mixer, setMixer] = useLocalStorage<SoundMixerState>(
    STORAGE_KEYS.SOUND_MIXER,
    getDefaultMixerState()
  );

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
  }, [customSoundIds, setMixer]);

  // Load from backend on mount
  useEffect(() => {
    let cancelled = false;
    soundApi.fetchSoundSettings()
      .then((settings) => {
        if (cancelled || settings.length === 0) return;
        setMixer(prev => {
          const next = { ...prev };
          for (const s of settings) {
            if (next[s.soundType]) {
              next[s.soundType] = { enabled: s.enabled, volume: s.volume };
            }
          }
          return next;
        });
      })
      .catch((e) => console.warn('[Sound] fetch settings:', e.message));
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-soundType debounce refs
  const syncTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const syncSoundSetting = useCallback((soundType: string, volume: number, enabled: boolean) => {
    clearTimeout(syncTimeoutRef.current[soundType]);
    syncTimeoutRef.current[soundType] = setTimeout(() => {
      soundApi.updateSoundSetting(soundType, volume, enabled).catch((e) => console.warn('[Sound] sync settings:', e.message));
    }, 500);
  }, []);

  const toggleSound = useCallback((id: string) => {
    setMixer(prev => {
      const current = prev[id];
      const newEnabled = !current.enabled;
      // Schedule sync after state update
      queueMicrotask(() => syncSoundSetting(id, current.volume, newEnabled));
      return { ...prev, [id]: { ...current, enabled: newEnabled } };
    });
  }, [setMixer, syncSoundSetting]);

  const setVolume = useCallback((id: string, volume: number) => {
    setMixer(prev => {
      const current = prev[id];
      queueMicrotask(() => syncSoundSetting(id, volume, current.enabled));
      return { ...prev, [id]: { ...current, volume } };
    });
  }, [setMixer, syncSoundSetting]);

  return { mixer, toggleSound, setVolume };
}
