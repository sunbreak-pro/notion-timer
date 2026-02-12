import { useState, useCallback, useMemo, type ReactNode } from 'react';
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
  const [manualPlay, setManualPlay] = useState(false);

  const toggleManualPlay = useCallback(() => {
    setManualPlay(prev => !prev);
  }, []);

  const customSoundIds = useMemo(
    () => customSounds.map(s => s.id),
    [customSounds]
  );

  const mixerHook = useLocalSoundMixer(customSoundIds);

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

  const { resetAllPlayback, seekSound, channelPositions } = useAudioEngine(mixerHook.mixer, soundSources, shouldPlay);

  const value: AudioContextValue = useMemo(() => ({
    mixer: mixerHook.mixer,
    toggleSound: mixerHook.toggleSound,
    setVolume: mixerHook.setVolume,
    customSounds,
    addSound,
    removeSound,
    resetAllPlayback,
    seekSound,
    channelPositions,
    workscreenSelections,
    toggleWorkscreenSelection,
    isWorkscreenSelected,
    manualPlay,
    toggleManualPlay,
    soundSources,
  }), [
    mixerHook.mixer, mixerHook.toggleSound, mixerHook.setVolume,
    customSounds, addSound, removeSound,
    resetAllPlayback, seekSound, channelPositions,
    workscreenSelections, toggleWorkscreenSelection, isWorkscreenSelected,
    manualPlay, toggleManualPlay, soundSources,
  ]);

  const controlValue: AudioControlContextValue = useMemo(() => ({
    toggleSound: mixerHook.toggleSound,
    setVolume: mixerHook.setVolume,
    addSound,
    removeSound,
    resetAllPlayback,
    seekSound,
    customSounds,
    toggleWorkscreenSelection,
  }), [
    mixerHook.toggleSound, mixerHook.setVolume,
    addSound, removeSound, resetAllPlayback, seekSound, customSounds,
    toggleWorkscreenSelection,
  ]);

  const stateValue: AudioStateContextValue = useMemo(() => ({
    mixer: mixerHook.mixer,
    channelPositions,
    workscreenSelections,
    isWorkscreenSelected,
  }), [mixerHook.mixer, channelPositions, workscreenSelections, isWorkscreenSelected]);

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
