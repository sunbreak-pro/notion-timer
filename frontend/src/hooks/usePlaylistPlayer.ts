import { useState, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "../constants/storageKeys";
import {
  usePlaylistEngine,
  type PlaylistEngineResult,
} from "./usePlaylistEngine";
import type { PlaylistDataResult } from "./usePlaylistData";
import type { PlaylistItem, RepeatMode } from "../types/playlist";

export interface PlaylistPlayerResult extends PlaylistEngineResult {
  activePlaylistId: string | null;
  setActivePlaylistId: (id: string | null) => void;
  activePlaylistItems: PlaylistItem[];
  repeatMode: RepeatMode;
  isShuffle: boolean;
  toggleRepeatMode: () => void;
  toggleShuffle: () => void;
}

export function usePlaylistPlayer(
  playlistData: PlaylistDataResult,
  soundSources: Record<string, string>,
  shouldPlay: boolean,
): PlaylistPlayerResult {
  const [activePlaylistId, setActivePlaylistIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAYLIST_ID),
  );

  const setActivePlaylistId = useCallback((id: string | null) => {
    setActivePlaylistIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAYLIST_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PLAYLIST_ID);
    }
  }, []);

  // Derive repeat/shuffle from the active playlist data (no setState in effect)
  const activePlaylist = useMemo(
    () => playlistData.playlists.find((p) => p.id === activePlaylistId),
    [playlistData.playlists, activePlaylistId],
  );
  const repeatMode: RepeatMode = activePlaylist?.repeatMode ?? "all";
  const isShuffle = activePlaylist?.isShuffle ?? false;

  const activePlaylistItems = useMemo(
    () =>
      activePlaylistId
        ? playlistData.itemsByPlaylist[activePlaylistId] || []
        : [],
    [activePlaylistId, playlistData.itemsByPlaylist],
  );

  const engine = usePlaylistEngine(
    activePlaylistItems,
    soundSources,
    shouldPlay && activePlaylistId !== null,
    repeatMode,
    isShuffle,
  );

  const toggleRepeatMode = useCallback(() => {
    if (!activePlaylistId) return;
    const next: RepeatMode =
      repeatMode === "all" ? "one" : repeatMode === "one" ? "off" : "all";
    playlistData
      .updatePlaylist(activePlaylistId, { repeatMode: next })
      .catch(() => {});
  }, [activePlaylistId, repeatMode, playlistData]);

  const toggleShuffle = useCallback(() => {
    if (!activePlaylistId) return;
    playlistData
      .updatePlaylist(activePlaylistId, { isShuffle: !isShuffle })
      .catch(() => {});
  }, [activePlaylistId, isShuffle, playlistData]);

  return {
    ...engine,
    activePlaylistId,
    setActivePlaylistId,
    activePlaylistItems,
    repeatMode,
    isShuffle,
    toggleRepeatMode,
    toggleShuffle,
  };
}
