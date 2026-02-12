import { useContext } from 'react';
import { AudioStateContext } from '../context/AudioStateContextValue';

export function useAudioState() {
  const context = useContext(AudioStateContext);
  if (!context) {
    throw new Error('useAudioState must be used within an AudioProvider');
  }
  return context;
}
