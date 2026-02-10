import { useContext } from 'react';
import { AudioContext } from '../context/audioContextValue';

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
}
