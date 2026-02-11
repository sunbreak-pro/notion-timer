import { useState, useRef, useCallback, useEffect } from 'react';
import type { SoundMixerState } from './useLocalSoundMixer';

interface AudioChannel {
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

export interface AudioEngineResult {
  resetAllPlayback: () => void;
  seekSound: (soundId: string, time: number) => void;
  channelPositions: Record<string, { currentTime: number; duration: number }>;
  channelsRef: React.MutableRefObject<Map<string, AudioChannel>>;
}

const FADE_DURATION = 0.2;
const POSITION_UPDATE_INTERVAL = 250;

export function useAudioEngine(mixer: SoundMixerState, soundSources: Record<string, string>, shouldPlay: boolean = true): AudioEngineResult {
  const contextRef = useRef<AudioContext | null>(null);
  const channelsRef = useRef<Map<string, AudioChannel>>(new Map());
  const mixerRef = useRef(mixer);
  useEffect(() => { mixerRef.current = mixer; }, [mixer]);

  const soundSourcesRef = useRef(soundSources);
  useEffect(() => { soundSourcesRef.current = soundSources; }, [soundSources]);

  const shouldPlayRef = useRef(shouldPlay);
  useEffect(() => { shouldPlayRef.current = shouldPlay; }, [shouldPlay]);

  const pauseTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const ensureContext = useCallback(() => {
    if (!contextRef.current || contextRef.current.state === 'closed') {
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

    const url = soundSourcesRef.current[soundId];
    if (!url) return null;

    const ctx = ensureContext();
    const audio = new Audio();
    audio.loop = true;
    audio.src = url;

    let source: MediaElementAudioSourceNode;
    try {
      source = ctx.createMediaElementSource(audio);
    } catch (e) {
      console.warn(`[AudioEngine] Failed to create source for ${soundId}:`, e);
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

  // Resume AudioContext on user gesture (Autoplay Policy)
  useEffect(() => {
    const resumeOnGesture = () => {
      if (contextRef.current?.state === 'suspended') {
        contextRef.current.resume();
      }
    };
    document.addEventListener('click', resumeOnGesture);
    document.addEventListener('keydown', resumeOnGesture);
    return () => {
      document.removeEventListener('click', resumeOnGesture);
      document.removeEventListener('keydown', resumeOnGesture);
    };
  }, []);

  // Sync mixer state to audio channels
  useEffect(() => {
    // When shouldPlay is false, fade out & pause ALL active channels
    if (!shouldPlay) {
      const ctx = contextRef.current;
      if (ctx) {
        for (const [soundId, channel] of channelsRef.current.entries()) {
          channel.gain.gain.cancelScheduledValues(ctx.currentTime);
          channel.gain.gain.setValueAtTime(channel.gain.gain.value, ctx.currentTime);
          channel.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_DURATION);

          const audio = channel.audio;
          const timeoutId = setTimeout(() => {
            pauseTimeoutsRef.current.delete(soundId);
            audio.pause();
          }, FADE_DURATION * 1000 + 50);
          pauseTimeoutsRef.current.set(soundId, timeoutId);
        }
      }
      return;
    }

    for (const soundId of Object.keys(mixer)) {
      const state = mixer[soundId];
      if (!state) continue;

      // Skip if no source URL available for this sound
      if (!soundSources[soundId]) continue;

      if (state.enabled) {
        // Cancel any pending pause timeout to prevent play/pause race
        const pendingPause = pauseTimeoutsRef.current.get(soundId);
        if (pendingPause) {
          clearTimeout(pendingPause);
          pauseTimeoutsRef.current.delete(soundId);
        }

        const channel = getOrCreateChannel(soundId);
        if (!channel) continue;

        const ctx = contextRef.current;
        if (!ctx) continue;

        // Set target volume with fade
        const targetVolume = state.volume / 100;
        channel.gain.gain.cancelScheduledValues(ctx.currentTime);
        channel.gain.gain.setValueAtTime(channel.gain.gain.value, ctx.currentTime);
        channel.gain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + FADE_DURATION);

        // Start playback if paused
        if (channel.audio.paused) {
          channel.audio.play().catch((e) => {
            console.warn(`[AudioEngine] Playback blocked for ${soundId}:`, e.message);
          });
        }
      } else {
        const channel = channelsRef.current.get(soundId);
        if (!channel) continue;

        const ctx = contextRef.current;
        if (!ctx) continue;

        // Fade out then pause
        channel.gain.gain.cancelScheduledValues(ctx.currentTime);
        channel.gain.gain.setValueAtTime(channel.gain.gain.value, ctx.currentTime);
        channel.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_DURATION);

        const audio = channel.audio;
        const timeoutId = setTimeout(() => {
          pauseTimeoutsRef.current.delete(soundId);
          if (!mixerRef.current[soundId]?.enabled) {
            audio.pause();
          }
        }, FADE_DURATION * 1000 + 50);
        pauseTimeoutsRef.current.set(soundId, timeoutId);
      }
    }
  }, [mixer, soundSources, shouldPlay, getOrCreateChannel]);

  // Cleanup channels whose source URLs have been removed
  useEffect(() => {
    for (const [soundId, channel] of channelsRef.current.entries()) {
      if (!soundSources[soundId]) {
        channel.gain.gain.value = 0;
        channel.audio.pause();
        channel.audio.src = '';
        channelsRef.current.delete(soundId);
      }
    }
  }, [soundSources]);


  // Cleanup on unmount
  useEffect(() => {
    const channels = channelsRef.current;
    return () => {
      for (const channel of channels.values()) {
        channel.audio.pause();
        channel.audio.src = '';
      }
      channels.clear();
      contextRef.current?.close();
      contextRef.current = null;
      for (const t of pauseTimeoutsRef.current.values()) clearTimeout(t);
      pauseTimeoutsRef.current.clear();
    };
  }, []);

  // Track channel positions for seek UI
  const [channelPositions, setChannelPositions] = useState<Record<string, { currentTime: number; duration: number }>>({});

  useEffect(() => {
    if (!shouldPlay) {
      setChannelPositions({});
      return;
    }
    const id = window.setInterval(() => {
      const positions: Record<string, { currentTime: number; duration: number }> = {};
      for (const [soundId, channel] of channelsRef.current.entries()) {
        const dur = channel.audio.duration;
        if (dur && !isNaN(dur) && dur > 0) {
          positions[soundId] = {
            currentTime: channel.audio.currentTime,
            duration: dur,
          };
        }
      }
      setChannelPositions(positions);
    }, POSITION_UPDATE_INTERVAL);
    return () => clearInterval(id);
  }, [shouldPlay]);

  const resetAllPlayback = useCallback(() => {
    for (const channel of channelsRef.current.values()) {
      channel.audio.currentTime = 0;
    }
  }, []);

  const seekSound = useCallback((soundId: string, time: number) => {
    const channel = channelsRef.current.get(soundId);
    if (channel) {
      channel.audio.currentTime = time;
    }
  }, []);

  return { resetAllPlayback, seekSound, channelPositions, channelsRef };
}
