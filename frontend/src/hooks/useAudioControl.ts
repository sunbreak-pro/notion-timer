import { useContext } from 'react';
import { AudioControlContext } from '../context/AudioControlContextValue';

export function useAudioControl() {
  const context = useContext(AudioControlContext);
  if (!context) {
    throw new Error('useAudioControl must be used within an AudioProvider');
  }
  return context;
}
