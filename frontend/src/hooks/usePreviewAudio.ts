import { useState, useRef, useCallback, useEffect } from 'react';

export function usePreviewAudio() {
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPreviewingId(null);
  }, []);

  const togglePreview = useCallback((soundId: string, url: string) => {
    if (previewingId === soundId) {
      stopPreview();
      return;
    }

    // Stop current preview if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.loop = false;
    audio.onended = () => {
      setPreviewingId(null);
      audioRef.current = null;
    };
    audio.play().catch((e) => {
      console.warn('[PreviewAudio] play failed:', e);
      setPreviewingId(null);
      audioRef.current = null;
    });

    audioRef.current = audio;
    setPreviewingId(soundId);
  }, [previewingId, stopPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { previewingId, togglePreview, stopPreview };
}
