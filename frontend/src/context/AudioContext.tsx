import { useMemo, type ReactNode } from 'react';
import { SOUND_TYPES } from '../constants/sounds';
import { useTimerContext } from '../hooks/useTimerContext';
import { useLocalSoundMixer } from '../hooks/useLocalSoundMixer';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useCustomSounds } from '../hooks/useCustomSounds';
import { AudioContext, type AudioContextValue } from './audioContextValue';

export function AudioProvider({ children }: { children: ReactNode }) {
  const timer = useTimerContext();
  const { customSounds, blobUrls, addSound, removeSound } = useCustomSounds();

  const customSoundIds = useMemo(
    () => customSounds.map(s => s.id),
    [customSounds]
  );

  const { mixer, toggleSound, setVolume } = useLocalSoundMixer(customSoundIds);

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

  const shouldPlay = timer.isRunning && timer.sessionType === 'WORK';

  useAudioEngine(mixer, soundSources, shouldPlay);

  const value: AudioContextValue = useMemo(() => ({
    mixer,
    toggleSound,
    setVolume,
    customSounds,
    addSound,
    removeSound,
  }), [mixer, toggleSound, setVolume, customSounds, addSound, removeSound]);

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}
