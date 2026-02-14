import { createContext } from "react";
import type { SoundMixerState } from "../hooks/useLocalSoundMixer";
import type { CustomSoundMeta } from "../types/customSound";
import type { AudioMode } from "../types/playlist";
import type { PlaylistPlayerResult } from "../hooks/usePlaylistPlayer";
import type { PlaylistDataResult } from "../hooks/usePlaylistData";

export interface AudioContextValue {
  mixer: SoundMixerState;
  toggleSound: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  customSounds: CustomSoundMeta[];
  addSound: (file: File) => Promise<{ error?: string }>;
  removeSound: (id: string) => Promise<void>;
  resetAllPlayback: () => void;
  seekSound: (id: string, time: number) => void;
  channelPositions: Record<string, { currentTime: number; duration: number }>;
  workscreenSelections: string[];
  toggleWorkscreenSelection: (soundId: string) => void;
  isWorkscreenSelected: (soundId: string) => boolean;
  manualPlay: boolean;
  toggleManualPlay: () => void;
  soundSources: Record<string, string>;
  audioMode: AudioMode;
  switchAudioMode: (mode: AudioMode) => void;
  playlistPlayer: PlaylistPlayerResult;
  playlistData: PlaylistDataResult;
}

export const AudioContext = createContext<AudioContextValue | null>(null);
