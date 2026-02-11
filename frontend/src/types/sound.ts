export type SessionCategory = 'WORK' | 'REST';

export interface SoundSettings {
  id: number;
  soundType: string;
  volume: number;
  enabled: boolean;
  sessionCategory: SessionCategory;
  updatedAt: Date;
}

export interface SoundPreset {
  id: number;
  name: string;
  settingsJson: string;
  createdAt: Date;
}

export interface SoundSettingsMap {
  [soundType: string]: {
    volume: number;
    enabled: boolean;
  };
}

export interface SoundTag {
  id: number;
  name: string;
  color: string;
}

export interface SoundDisplayMeta {
  soundId: string;
  displayName: string | null;
}
