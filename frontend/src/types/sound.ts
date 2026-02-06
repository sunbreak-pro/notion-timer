export interface SoundSettings {
  id: number;
  soundType: string;
  volume: number;
  enabled: boolean;
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
