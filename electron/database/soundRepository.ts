import type Database from 'better-sqlite3';
import type { SoundSettings, SoundPreset } from '../types';

interface SoundSettingsRow {
  id: number;
  sound_type: string;
  volume: number;
  enabled: number;
  updated_at: string;
}

interface SoundPresetRow {
  id: number;
  name: string;
  settings_json: string;
  created_at: string;
}

function settingsRowToObj(row: SoundSettingsRow): SoundSettings {
  return {
    id: row.id,
    soundType: row.sound_type,
    volume: row.volume,
    enabled: !!row.enabled,
    updatedAt: row.updated_at,
  };
}

function presetRowToObj(row: SoundPresetRow): SoundPreset {
  return {
    id: row.id,
    name: row.name,
    settingsJson: row.settings_json,
    createdAt: row.created_at,
  };
}

export function createSoundRepository(db: Database.Database) {
  const stmts = {
    fetchSettings: db.prepare(`SELECT * FROM sound_settings ORDER BY sound_type ASC`),
    upsertSetting: db.prepare(`
      INSERT INTO sound_settings (sound_type, volume, enabled, updated_at)
      VALUES (@soundType, @volume, @enabled, datetime('now'))
      ON CONFLICT(sound_type) DO UPDATE SET
        volume = @volume, enabled = @enabled, updated_at = datetime('now')
    `),
    fetchSettingByType: db.prepare(`SELECT * FROM sound_settings WHERE sound_type = ?`),
    fetchPresets: db.prepare(`SELECT * FROM sound_presets ORDER BY created_at DESC`),
    createPreset: db.prepare(`
      INSERT INTO sound_presets (name, settings_json, created_at)
      VALUES (@name, @settingsJson, datetime('now'))
    `),
    fetchPresetById: db.prepare(`SELECT * FROM sound_presets WHERE id = ?`),
    deletePreset: db.prepare(`DELETE FROM sound_presets WHERE id = ?`),
  };

  return {
    fetchSettings(): SoundSettings[] {
      return (stmts.fetchSettings.all() as SoundSettingsRow[]).map(settingsRowToObj);
    },

    updateSetting(soundType: string, volume: number, enabled: boolean): SoundSettings {
      stmts.upsertSetting.run({ soundType, volume, enabled: enabled ? 1 : 0 });
      const row = stmts.fetchSettingByType.get(soundType) as SoundSettingsRow;
      return settingsRowToObj(row);
    },

    fetchPresets(): SoundPreset[] {
      return (stmts.fetchPresets.all() as SoundPresetRow[]).map(presetRowToObj);
    },

    createPreset(name: string, settingsJson: string): SoundPreset {
      const info = stmts.createPreset.run({ name, settingsJson });
      const row = stmts.fetchPresetById.get(info.lastInsertRowid) as SoundPresetRow;
      return presetRowToObj(row);
    },

    deletePreset(id: number): void {
      stmts.deletePreset.run(id);
    },
  };
}

export type SoundRepository = ReturnType<typeof createSoundRepository>;
