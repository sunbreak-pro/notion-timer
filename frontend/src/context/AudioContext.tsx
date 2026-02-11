import { useMemo, type ReactNode } from 'react';
import { SOUND_TYPES } from '../constants/sounds';
import { useTimerContext } from '../hooks/useTimerContext';
import { useLocalSoundMixer } from '../hooks/useLocalSoundMixer';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useCustomSounds } from '../hooks/useCustomSounds';
import { AudioContext, type AudioContextValue } from './AudioContextValue';

export function AudioProvider({ children }: { children: ReactNode }) {
  const timer = useTimerContext();
  const { customSounds, blobUrls, addSound, removeSound } = useCustomSounds();

  const customSoundIds = useMemo(
    () => customSounds.map(s => s.id),
    [customSounds]
  );

  const workMixerHook = useLocalSoundMixer(customSoundIds, 'WORK');
  const restMixerHook = useLocalSoundMixer(customSoundIds, 'REST');

  const activeMixer = timer.sessionType === 'WORK'
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

  useAudioEngine(activeMixer, soundSources, shouldPlay);

  const value: AudioContextValue = useMemo(() => ({
    mixer: activeMixer,
    toggleSound: timer.sessionType === 'WORK' ? workMixerHook.toggleSound : restMixerHook.toggleSound,
    setVolume: timer.sessionType === 'WORK' ? workMixerHook.setVolume : restMixerHook.setVolume,
    workMixer: workMixerHook.mixer,
    restMixer: restMixerHook.mixer,
    toggleWorkSound: workMixerHook.toggleSound,
    toggleRestSound: restMixerHook.toggleSound,
    setWorkVolume: workMixerHook.setVolume,
    setRestVolume: restMixerHook.setVolume,
    customSounds,
    addSound,
    removeSound,
  }), [
    activeMixer, timer.sessionType,
    workMixerHook.mixer, workMixerHook.toggleSound, workMixerHook.setVolume,
    restMixerHook.mixer, restMixerHook.toggleSound, restMixerHook.setVolume,
    customSounds, addSound, removeSound,
  ]);

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}
