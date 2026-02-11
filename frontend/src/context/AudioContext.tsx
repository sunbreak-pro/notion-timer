import { useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { SOUND_TYPES } from '../constants/sounds';
import { useTimerContext } from '../hooks/useTimerContext';
import { useLocalSoundMixer } from '../hooks/useLocalSoundMixer';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useCustomSounds } from '../hooks/useCustomSounds';
import { useWorkscreenSelections } from '../hooks/useWorkscreenSelections';
import { AudioContext, type AudioContextValue } from './AudioContextValue';

export function AudioProvider({ children }: { children: ReactNode }) {
  const timer = useTimerContext();
  const { customSounds, blobUrls, addSound, removeSound } = useCustomSounds();
  const { selections: workscreenSelections } = useWorkscreenSelections();
  const [mixerOverride, setMixerOverrideRaw] = useState<'WORK' | 'REST' | null>(null);

  // Clear override when sessionType changes (auto-transition overrides manual)
  const prevSessionTypeRef = useRef(timer.sessionType);
  if (prevSessionTypeRef.current !== timer.sessionType) {
    prevSessionTypeRef.current = timer.sessionType;
    if (mixerOverride !== null) setMixerOverrideRaw(null);
  }

  const setMixerOverride = useCallback((type: 'WORK' | 'REST' | null) => {
    setMixerOverrideRaw(type);
  }, []);

  const customSoundIds = useMemo(
    () => customSounds.map(s => s.id),
    [customSounds]
  );

  const workMixerHook = useLocalSoundMixer(customSoundIds, 'WORK');
  const restMixerHook = useLocalSoundMixer(customSoundIds, 'REST');

  // Determine effective mixer type: override takes priority
  const effectiveMixerType = mixerOverride ?? (timer.sessionType === 'WORK' ? 'WORK' : 'REST');
  const activeMixer = effectiveMixerType === 'WORK'
    ? workMixerHook.mixer
    : restMixerHook.mixer;

  const soundSources = useMemo(() => {
    const sources: Record<string, string> = {};
    for (const s of SOUND_TYPES) {
      sources[s.id] = s.file;
    }
    for (const [id, url] of Object.entries(blobUrls)) {
      sources[id] = url;
    }
    return sources;
  }, [blobUrls]);

  const shouldPlay = timer.isRunning;

  const { resetAllPlayback, seekSound, channelPositions } = useAudioEngine(activeMixer, soundSources, shouldPlay);

  const value: AudioContextValue = useMemo(() => ({
    mixer: activeMixer,
    toggleSound: effectiveMixerType === 'WORK' ? workMixerHook.toggleSound : restMixerHook.toggleSound,
    setVolume: effectiveMixerType === 'WORK' ? workMixerHook.setVolume : restMixerHook.setVolume,
    workMixer: workMixerHook.mixer,
    restMixer: restMixerHook.mixer,
    toggleWorkSound: workMixerHook.toggleSound,
    toggleRestSound: restMixerHook.toggleSound,
    setWorkVolume: workMixerHook.setVolume,
    setRestVolume: restMixerHook.setVolume,
    customSounds,
    addSound,
    removeSound,
    setMixerOverride,
    resetAllPlayback,
    seekSound,
    channelPositions,
    workscreenSelections,
  }), [
    activeMixer, effectiveMixerType,
    workMixerHook.mixer, workMixerHook.toggleSound, workMixerHook.setVolume,
    restMixerHook.mixer, restMixerHook.toggleSound, restMixerHook.setVolume,
    customSounds, addSound, removeSound,
    setMixerOverride, resetAllPlayback, seekSound, channelPositions,
    workscreenSelections,
  ]);

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}
