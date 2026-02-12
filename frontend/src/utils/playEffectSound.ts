import { STORAGE_KEYS } from '../constants/storageKeys';

export function playEffectSound(src: string): void {
  try {
    const audio = new Audio(src);
    const stored = localStorage.getItem(STORAGE_KEYS.EFFECT_VOLUME);
    const volume = stored !== null ? Number(stored) / 100 : 0.7;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.addEventListener('ended', () => { audio.remove(); });
    // Intentionally silent: autoplay policy may block this in some browsers
    audio.play().catch(() => {});
  } catch {
    // Silently ignore audio errors
  }
}
