import { useRef, useCallback, useEffect } from 'react';
import { SOUND_TYPES } from '../constants/sounds';
import type { SoundMixerState } from './useLocalSoundMixer';

interface AudioChannel {
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

const FADE_DURATION = 0.2;

export function useAudioEngine(mixer: SoundMixerState) {
  const contextRef = useRef<AudioContext | null>(null);
  const channelsRef = useRef<Map<string, AudioChannel>>(new Map());
  const mixerRef = useRef(mixer);
  useEffect(() => { mixerRef.current = mixer; }, [mixer]);

  const ensureContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    if (contextRef.current.state === 'suspended') {
      contextRef.current.resume();
    }
    return contextRef.current;
  }, []);

  const getOrCreateChannel = useCallback((soundId: string): AudioChannel | null => {
    const existing = channelsRef.current.get(soundId);
    if (existing) return existing;

    const soundType = SOUND_TYPES.find(s => s.id === soundId);
    if (!soundType) return null;

    const ctx = ensureContext();
    const audio = new Audio(soundType.file);
    audio.loop = true;
    audio.crossOrigin = 'anonymous';

    let source: MediaElementAudioSourceNode;
    try {
      source = ctx.createMediaElementSource(audio);
    } catch {
      return null;
    }
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(ctx.destination);

    const channel: AudioChannel = { audio, source, gain };
    channelsRef.current.set(soundId, channel);
    return channel;
  }, [ensureContext]);

  // Sync mixer state to audio channels
  useEffect(() => {
    for (const soundType of SOUND_TYPES) {
      const state = mixer[soundType.id];
      if (!state) continue;

      if (state.enabled) {
        const channel = getOrCreateChannel(soundType.id);
        if (!channel) continue;

        const ctx = contextRef.current;
        if (!ctx) continue;

        // Set target volume with fade
        const targetVolume = state.volume / 100;
        channel.gain.gain.cancelScheduledValues(ctx.currentTime);
        channel.gain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + FADE_DURATION);

        // Start playback if paused
        if (channel.audio.paused) {
          channel.audio.play().catch(() => {
            // Autoplay blocked — will retry on next user interaction
          });
        }
      } else {
        const channel = channelsRef.current.get(soundType.id);
        if (!channel) continue;

        const ctx = contextRef.current;
        if (!ctx) continue;

        // Fade out then pause
        channel.gain.gain.cancelScheduledValues(ctx.currentTime);
        channel.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_DURATION);

        const audio = channel.audio;
        setTimeout(() => {
          if (!mixerRef.current[soundType.id]?.enabled) {
            audio.pause();
          }
        }, FADE_DURATION * 1000 + 50);
      }
    }
  }, [mixer, getOrCreateChannel]);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibility = () => {
      const ctx = contextRef.current;
      if (!ctx) return;

      if (document.hidden) {
        // Mute all when tab hidden
        for (const channel of channelsRef.current.values()) {
          channel.gain.gain.cancelScheduledValues(ctx.currentTime);
          channel.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        }
      } else {
        // Restore volumes when tab visible
        const currentMixer = mixerRef.current;
        for (const [id, channel] of channelsRef.current.entries()) {
          const state = currentMixer[id];
          if (state?.enabled) {
            const targetVolume = state.volume / 100;
            channel.gain.gain.cancelScheduledValues(ctx.currentTime);
            channel.gain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + FADE_DURATION);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const channels = channelsRef.current;
    return () => {
      for (const channel of channels.values()) {
        channel.audio.pause();
        channel.audio.src = '';
      }
      channels.clear();
      // contextRef may have been set after effect registration
      contextRef.current?.close();
    };
  }, []);
}
