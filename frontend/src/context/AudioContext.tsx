import { useState, useCallback, useMemo, type ReactNode } from "react";
import { SOUND_TYPES } from "../constants/sounds";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { useTimerContext } from "../hooks/useTimerContext";
import { useLocalSoundMixer } from "../hooks/useLocalSoundMixer";
import { useAudioEngine } from "../hooks/useAudioEngine";
import { useCustomSounds } from "../hooks/useCustomSounds";
import { useWorkscreenSelections } from "../hooks/useWorkscreenSelections";
import { usePlaylistData } from "../hooks/usePlaylistData";
import { usePlaylistPlayer } from "../hooks/usePlaylistPlayer";
import { AudioContext, type AudioContextValue } from "./AudioContextValue";
import {
  AudioControlContext,
  type AudioControlContextValue,
} from "./AudioControlContextValue";
import {
  AudioStateContext,
  type AudioStateContextValue,
} from "./AudioStateContextValue";
import type { AudioMode } from "../types/playlist";

export function AudioProvider({ children }: { children: ReactNode }) {
  const timer = useTimerContext();
  const { customSounds, blobUrls, addSound, removeSound } = useCustomSounds();
  const {
    selections: workscreenSelections,
    toggleSelection: toggleWorkscreenSelection,
    isSelected: isWorkscreenSelected,
  } = useWorkscreenSelections();
  const [manualPlay, setManualPlay] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>(
    () =>
      (localStorage.getItem(STORAGE_KEYS.AUDIO_MODE) as AudioMode) || "mixer",
  );

  const toggleManualPlay = useCallback(() => {
    setManualPlay((prev) => !prev);
  }, []);

  const switchAudioMode = useCallback((mode: AudioMode) => {
    setAudioMode(mode);
    localStorage.setItem(STORAGE_KEYS.AUDIO_MODE, mode);
  }, []);

  const customSoundIds = useMemo(
    () => customSounds.map((s) => s.id),
    [customSounds],
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

  // Mixer engine: only active when audioMode === 'mixer'
  const mixerShouldPlay = shouldPlay && audioMode === "mixer";
  const { resetAllPlayback, seekSound, channelPositions } = useAudioEngine(
    mixerHook.mixer,
    soundSources,
    mixerShouldPlay,
  );

  // Playlist engine: only active when audioMode === 'playlist'
  const playlistData = usePlaylistData();
  const playlistShouldPlay = shouldPlay && audioMode === "playlist";
  const playlistPlayer = usePlaylistPlayer(
    playlistData,
    soundSources,
    playlistShouldPlay,
  );

  const value: AudioContextValue = useMemo(
    () => ({
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
      audioMode,
      switchAudioMode,
      playlistPlayer,
      playlistData,
    }),
    [
      mixerHook.mixer,
      mixerHook.toggleSound,
      mixerHook.setVolume,
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
      audioMode,
      switchAudioMode,
      playlistPlayer,
      playlistData,
    ],
  );

  const controlValue: AudioControlContextValue = useMemo(
    () => ({
      toggleSound: mixerHook.toggleSound,
      setVolume: mixerHook.setVolume,
      addSound,
      removeSound,
      resetAllPlayback,
      seekSound,
      customSounds,
      toggleWorkscreenSelection,
    }),
    [
      mixerHook.toggleSound,
      mixerHook.setVolume,
      addSound,
      removeSound,
      resetAllPlayback,
      seekSound,
      customSounds,
      toggleWorkscreenSelection,
    ],
  );

  const stateValue: AudioStateContextValue = useMemo(
    () => ({
      mixer: mixerHook.mixer,
      channelPositions,
      workscreenSelections,
      isWorkscreenSelected,
    }),
    [
      mixerHook.mixer,
      channelPositions,
      workscreenSelections,
      isWorkscreenSelected,
    ],
  );

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
