import type Database from 'better-sqlite3';
import type { AISettingsResponse } from '../types';
import { encryptString, decryptString } from '../services/safeStorageService';

interface AISettingsRow {
  id: number;
  api_key: string;
  model: string;
  updated_at: string;
}

function maskApiKey(key: string): string {
  // Decrypt first to check length, but only show masked version
  const raw = decryptString(key);
  if (!raw || raw.length < 8) return raw ? '****' : '';
  return raw.substring(0, 4) + '****' + raw.substring(raw.length - 4);
}

export function createAIRepository(db: Database.Database) {
  const stmts = {
    fetch: db.prepare(`SELECT * FROM ai_settings WHERE id = 1`),
    update: db.prepare(`
      UPDATE ai_settings SET
        api_key = CASE WHEN @apiKey IS NOT NULL THEN @apiKey ELSE api_key END,
        model = CASE WHEN @model IS NOT NULL THEN @model ELSE model END,
        updated_at = datetime('now')
      WHERE id = 1
    `),
    updateModel: db.prepare(`UPDATE ai_settings SET model = @model, updated_at = datetime('now') WHERE id = 1`),
  };

  return {
    fetchSettings(): AISettingsResponse {
      const row = stmts.fetch.get() as AISettingsRow;
      return {
        apiKey: maskApiKey(row.api_key),
        model: row.model,
        hasApiKey: !!decryptString(row.api_key),
      };
    },

    updateSettings(settings: { apiKey?: string; model?: string }): AISettingsResponse {
      stmts.update.run({
        apiKey: settings.apiKey != null ? encryptString(settings.apiKey) : null,
        model: settings.model ?? null,
      });
      const row = stmts.fetch.get() as AISettingsRow;
      return {
        apiKey: maskApiKey(row.api_key),
        model: row.model,
        hasApiKey: !!decryptString(row.api_key),
      };
    },

    getRawApiKey(): string {
      const row = stmts.fetch.get() as AISettingsRow;
      return decryptString(row.api_key);
    },

    getModel(): string {
      const row = stmts.fetch.get() as AISettingsRow;
      return row.model;
    },

    migrateDeprecatedModel(): void {
      const row = stmts.fetch.get() as AISettingsRow;
      if (row.model === 'gemini-2.0-flash') {
        stmts.updateModel.run({ model: 'gemini-2.5-flash-lite' });
      }
    },
  };
}

export type AIRepository = ReturnType<typeof createAIRepository>;
