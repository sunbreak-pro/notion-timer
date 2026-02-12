import { useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { SOUND_TYPES } from '../constants/sounds';
import { useTimerContext } from '../hooks/useTimerContext';
import { useLocalSoundMixer } from '../hooks/useLocalSoundMixer';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useCustomSounds } from '../hooks/useCustomSounds';
import { useWorkscreenSelections } from '../hooks/useWorkscreenSelections';
import { AudioContext, type AudioContextValue } from './AudioContextValue';
import { AudioControlContext, type AudioControlContextValue } from './AudioControlContextValue';
import { AudioStateContext, type AudioStateContextValue } from './AudioStateContextValue';

export function AudioProvider({ children }: { children: ReactNode }) {
  const timer = useTimerContext();
  const { customSounds, blobUrls, addSound, removeSound } = useCustomSounds();
  const { selections: workscreenSelections, toggleSelection: toggleWorkscreenSelection, isSelected: isWorkscreenSelected } = useWorkscreenSelections();
  const [mixerOverride, setMixerOverrideRaw] = useState<'WORK' | 'REST' | null>(null);
  const [manualPlay, setManualPlay] = useState(false);

  // Clear override when sessionType changes (auto-transition overrides manual)
  const prevSessionTypeRef = useRef(timer.sessionType);
  if (prevSessionTypeRef.current !== timer.sessionType) {
    prevSessionTypeRef.current = timer.sessionType;
    if (mixerOverride !== null) setMixerOverrideRaw(null);
  }

  const setMixerOverride = useCallback((type: 'WORK' | 'REST' | null) => {
    setMixerOverrideRaw(type);
  }, []);

  const toggleManualPlay = useCallback(() => {
    setManualPlay(prev => !prev);
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

  const shouldPlay = timer.isRunning || manualPlay;

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
    toggleWorkscreenSelection,
    isWorkscreenSelected,
    manualPlay,
    toggleManualPlay,
  }), [
    activeMixer, effectiveMixerType,
    workMixerHook.mixer, workMixerHook.toggleSound, workMixerHook.setVolume,
    restMixerHook.mixer, restMixerHook.toggleSound, restMixerHook.setVolume,
    customSounds, addSound, removeSound,
    setMixerOverride, resetAllPlayback, seekSound, channelPositions,
    workscreenSelections, toggleWorkscreenSelection, isWorkscreenSelected,
    manualPlay, toggleManualPlay,
  ]);

  const controlValue: AudioControlContextValue = useMemo(() => ({
    toggleSound: effectiveMixerType === 'WORK' ? workMixerHook.toggleSound : restMixerHook.toggleSound,
    setVolume: effectiveMixerType === 'WORK' ? workMixerHook.setVolume : restMixerHook.setVolume,
    toggleWorkSound: workMixerHook.toggleSound,
    toggleRestSound: restMixerHook.toggleSound,
    setWorkVolume: workMixerHook.setVolume,
    setRestVolume: restMixerHook.setVolume,
    addSound,
    removeSound,
    setMixerOverride,
    resetAllPlayback,
    seekSound,
    customSounds,
    toggleWorkscreenSelection,
  }), [
    effectiveMixerType, workMixerHook.toggleSound, workMixerHook.setVolume,
    restMixerHook.toggleSound, restMixerHook.setVolume,
    addSound, removeSound, setMixerOverride, resetAllPlayback, seekSound, customSounds,
    toggleWorkscreenSelection,
  ]);

  const stateValue: AudioStateContextValue = useMemo(() => ({
    mixer: activeMixer,
    workMixer: workMixerHook.mixer,
    restMixer: restMixerHook.mixer,
    channelPositions,
    workscreenSelections,
    isWorkscreenSelected,
  }), [activeMixer, workMixerHook.mixer, restMixerHook.mixer, channelPositions, workscreenSelections, isWorkscreenSelected]);

  return (
    <AudioContext.Provider value={value}>
      <AudioControlContext.Provider value={controlValue}>
        <AudioStateContext.Provider value={stateValue}>
          {children}
        </AudioStateContext.Provider>
      </AudioControlContext.Provider>
    </AudioContext.Provider>
  );
}
