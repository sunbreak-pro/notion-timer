import type Database from 'better-sqlite3';
import type { SoundSettings, SoundPreset, SoundTag, SoundDisplayMeta } from '../types';

interface SoundSettingsRow {
  id: number;
  sound_type: string;
  volume: number;
  enabled: number;
  session_category: string;
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
    sessionCategory: row.session_category as 'WORK' | 'REST',
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
  // Helper to check if a table exists before preparing statements
  function tableExists(name: string): boolean {
    const row = db.prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`).get(name) as { '1': number } | undefined;
    return !!row;
  }

  // Core statements (V1-V4 tables) — always safe
  const stmts = {
    fetchSettings: db.prepare(`SELECT * FROM sound_settings ORDER BY sound_type ASC`),
    fetchSettingsByCategory: db.prepare(`SELECT * FROM sound_settings WHERE session_category = ? ORDER BY sound_type ASC`),
    upsertSetting: db.prepare(`
      INSERT INTO sound_settings (sound_type, volume, enabled, session_category, updated_at)
      VALUES (@soundType, @volume, @enabled, @sessionCategory, datetime('now'))
      ON CONFLICT(sound_type, session_category) DO UPDATE SET
        volume = @volume, enabled = @enabled, updated_at = datetime('now')
    `),
    fetchSettingByTypeAndCategory: db.prepare(`SELECT * FROM sound_settings WHERE sound_type = ? AND session_category = ?`),
    fetchPresets: db.prepare(`SELECT * FROM sound_presets ORDER BY created_at DESC`),
    createPreset: db.prepare(`
      INSERT INTO sound_presets (name, settings_json, created_at)
      VALUES (@name, @settingsJson, datetime('now'))
    `),
    fetchPresetById: db.prepare(`SELECT * FROM sound_presets WHERE id = ?`),
    deletePreset: db.prepare(`DELETE FROM sound_presets WHERE id = ?`),
  };

  // V7 tag statements — guarded by table existence check
  const hasTagTables = tableExists('sound_tag_definitions') && tableExists('sound_tag_assignments') && tableExists('sound_display_meta');

  const tagStmts = hasTagTables ? {
    fetchAllSoundTags: db.prepare(`SELECT * FROM sound_tag_definitions ORDER BY name ASC`),
    fetchSoundTagById: db.prepare(`SELECT * FROM sound_tag_definitions WHERE id = ?`),
    insertSoundTag: db.prepare(`INSERT INTO sound_tag_definitions (name, color) VALUES (?, ?)`),
    updateSoundTag: db.prepare(`UPDATE sound_tag_definitions SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?`),
    deleteSoundTag: db.prepare(`DELETE FROM sound_tag_definitions WHERE id = ?`),
    fetchTagsForSound: db.prepare(`
      SELECT t.* FROM sound_tag_definitions t
      INNER JOIN sound_tag_assignments sta ON t.id = sta.tag_id
      WHERE sta.sound_id = ?
      ORDER BY t.name ASC
    `),
    clearSoundTags: db.prepare(`DELETE FROM sound_tag_assignments WHERE sound_id = ?`),
    insertSoundTagAssignment: db.prepare(`INSERT OR IGNORE INTO sound_tag_assignments (sound_id, tag_id) VALUES (?, ?)`),
    fetchAllSoundTagAssignments: db.prepare(`SELECT sound_id, tag_id FROM sound_tag_assignments`),
    fetchAllDisplayMeta: db.prepare(`SELECT sound_id, display_name FROM sound_display_meta`),
    upsertDisplayMeta: db.prepare(`
      INSERT INTO sound_display_meta (sound_id, display_name)
      VALUES (@soundId, @displayName)
      ON CONFLICT(sound_id) DO UPDATE SET display_name = @displayName
    `),
  } : null;

  // V8 workscreen selection statements
  const hasSelectionTable = tableExists('sound_workscreen_selections');
  const selStmts = hasSelectionTable ? {
    fetchByCategory: db.prepare(`SELECT sound_id, display_order FROM sound_workscreen_selections WHERE session_category = ? ORDER BY display_order ASC`),
    deleteByCategory: db.prepare(`DELETE FROM sound_workscreen_selections WHERE session_category = ?`),
    insert: db.prepare(`INSERT INTO sound_workscreen_selections (sound_id, session_category, display_order) VALUES (?, ?, ?)`),
  } : null;

  return {
    fetchSettings(sessionCategory?: string): SoundSettings[] {
      if (sessionCategory) {
        return (stmts.fetchSettingsByCategory.all(sessionCategory) as SoundSettingsRow[]).map(settingsRowToObj);
      }
      return (stmts.fetchSettings.all() as SoundSettingsRow[]).map(settingsRowToObj);
    },

    updateSetting(soundType: string, volume: number, enabled: boolean, sessionCategory: string = 'WORK'): SoundSettings {
      stmts.upsertSetting.run({ soundType, volume, enabled: enabled ? 1 : 0, sessionCategory });
      const row = stmts.fetchSettingByTypeAndCategory.get(soundType, sessionCategory) as SoundSettingsRow;
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

    // Sound tags (guarded — return empty/no-op when V7 tables missing)
    fetchAllSoundTags(): SoundTag[] {
      if (!tagStmts) return [];
      return tagStmts.fetchAllSoundTags.all() as SoundTag[];
    },

    createSoundTag(name: string, color: string): SoundTag {
      if (!tagStmts) throw new Error('Sound tag tables not available. Please restart the app.');
      const info = tagStmts.insertSoundTag.run(name, color);
      return tagStmts.fetchSoundTagById.get(info.lastInsertRowid) as SoundTag;
    },

    updateSoundTag(id: number, name?: string, color?: string): SoundTag {
      if (!tagStmts) throw new Error('Sound tag tables not available. Please restart the app.');
      tagStmts.updateSoundTag.run(name ?? null, color ?? null, id);
      const row = tagStmts.fetchSoundTagById.get(id) as SoundTag | undefined;
      if (!row) throw new Error(`Sound tag not found: ${id}`);
      return row;
    },

    deleteSoundTag(id: number): void {
      if (!tagStmts) return;
      tagStmts.deleteSoundTag.run(id);
    },

    fetchTagsForSound(soundId: string): SoundTag[] {
      if (!tagStmts) return [];
      return tagStmts.fetchTagsForSound.all(soundId) as SoundTag[];
    },

    setTagsForSound: db.transaction((soundId: string, tagIds: number[]) => {
      if (!tagStmts) return;
      tagStmts.clearSoundTags.run(soundId);
      for (const tagId of tagIds) {
        tagStmts.insertSoundTagAssignment.run(soundId, tagId);
      }
    }),

    fetchAllSoundTagAssignments(): Array<{ sound_id: string; tag_id: number }> {
      if (!tagStmts) return [];
      return tagStmts.fetchAllSoundTagAssignments.all() as Array<{ sound_id: string; tag_id: number }>;
    },

    // Sound display meta (guarded)
    fetchAllSoundDisplayMeta(): SoundDisplayMeta[] {
      if (!tagStmts) return [];
      return (tagStmts.fetchAllDisplayMeta.all() as Array<{ sound_id: string; display_name: string | null }>).map(
        row => ({ soundId: row.sound_id, displayName: row.display_name })
      );
    },

    updateSoundDisplayMeta(soundId: string, displayName: string): void {
      if (!tagStmts) return;
      tagStmts.upsertDisplayMeta.run({ soundId, displayName });
    },

    // Workscreen selections (V8)
    fetchWorkscreenSelections(sessionCategory: string): Array<{ soundId: string; displayOrder: number }> {
      if (!selStmts) return [];
      return (selStmts.fetchByCategory.all(sessionCategory) as Array<{ sound_id: string; display_order: number }>)
        .map(row => ({ soundId: row.sound_id, displayOrder: row.display_order }));
    },

    setWorkscreenSelections: db.transaction((sessionCategory: string, soundIds: string[]) => {
      if (!selStmts) return;
      selStmts.deleteByCategory.run(sessionCategory);
      for (let i = 0; i < soundIds.length; i++) {
        selStmts.insert.run(soundIds[i], sessionCategory, i);
      }
    }),
  };
}

export type SoundRepository = ReturnType<typeof createSoundRepository>;
