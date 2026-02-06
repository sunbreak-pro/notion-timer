import { apiClient } from './client';
import type { SoundSettings, SoundPreset } from '../types/sound';

interface SoundSettingsResponse {
  id: number;
  soundType: string;
  volume: number;
  enabled: boolean;
  updatedAt: string;
}

interface SoundPresetResponse {
  id: number;
  name: string;
  settingsJson: string;
  createdAt: string;
}

function mapSoundSettingsResponse(response: SoundSettingsResponse): SoundSettings {
  return {
    id: response.id,
    soundType: response.soundType,
    volume: response.volume,
    enabled: response.enabled,
    updatedAt: new Date(response.updatedAt),
  };
}

function mapSoundPresetResponse(response: SoundPresetResponse): SoundPreset {
  return {
    id: response.id,
    name: response.name,
    settingsJson: response.settingsJson,
    createdAt: new Date(response.createdAt),
  };
}

export const soundApi = {
  async getAllSettings(): Promise<SoundSettings[]> {
    const response = await apiClient.get<SoundSettingsResponse[]>('/api/sound-settings');
    return response.data.map(mapSoundSettingsResponse);
  },

  async updateSettings(
    soundType: string,
    updates: { volume?: number; enabled?: boolean }
  ): Promise<SoundSettings> {
    const response = await apiClient.put<SoundSettingsResponse>('/api/sound-settings', {
      soundType,
      ...updates,
    });
    return mapSoundSettingsResponse(response.data);
  },

  async getAllPresets(): Promise<SoundPreset[]> {
    const response = await apiClient.get<SoundPresetResponse[]>('/api/sound-presets');
    return response.data.map(mapSoundPresetResponse);
  },

  async createPreset(name: string, settingsJson: string): Promise<SoundPreset> {
    const response = await apiClient.post<SoundPresetResponse>('/api/sound-presets', {
      name,
      settingsJson,
    });
    return mapSoundPresetResponse(response.data);
  },

  async deletePreset(id: number): Promise<void> {
    await apiClient.delete(`/api/sound-presets/${id}`);
  },
};
