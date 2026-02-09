import type { SoundSettings, SoundPreset } from '../types/sound';

export async function fetchSoundSettings(): Promise<SoundSettings[]> {
  const res = await fetch('/api/sound-settings');
  if (!res.ok) throw new Error(`Failed to fetch sound settings: ${res.status}`);
  return res.json();
}

export async function updateSoundSetting(soundType: string, volume: number, enabled: boolean): Promise<SoundSettings> {
  const res = await fetch('/api/sound-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ soundType, volume, enabled }),
  });
  if (!res.ok) throw new Error(`Failed to update sound setting: ${res.status}`);
  return res.json();
}

export async function fetchSoundPresets(): Promise<SoundPreset[]> {
  const res = await fetch('/api/sound-presets');
  if (!res.ok) throw new Error(`Failed to fetch sound presets: ${res.status}`);
  return res.json();
}

export async function createSoundPreset(name: string, settingsJson: string): Promise<SoundPreset> {
  const res = await fetch('/api/sound-presets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, settingsJson }),
  });
  if (!res.ok) throw new Error(`Failed to create sound preset: ${res.status}`);
  return res.json();
}

export async function deleteSoundPreset(id: number): Promise<void> {
  const res = await fetch(`/api/sound-presets/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete sound preset: ${res.status}`);
}
