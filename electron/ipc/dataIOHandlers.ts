import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type Database from 'better-sqlite3';

export function registerDataIOHandlers(db: Database.Database): void {
  ipcMain.handle('data:export', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return false;

    const result = await dialog.showSaveDialog(win, {
      title: 'Export Data',
      defaultPath: `sonic-flow-export-${formatTimestamp()}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (result.canceled || !result.filePath) return false;

    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: 'Sonic Flow',
      data: {
        tasks: db.prepare('SELECT * FROM tasks').all(),
        timerSettings: db.prepare('SELECT * FROM timer_settings WHERE id = 1').get(),
        timerSessions: db.prepare('SELECT * FROM timer_sessions').all(),
        soundSettings: db.prepare('SELECT * FROM sound_settings').all(),
        soundPresets: db.prepare('SELECT * FROM sound_presets').all(),
        memos: db.prepare('SELECT * FROM memos').all(),
        tags: db.prepare('SELECT * FROM tags').all(),
        taskTags: db.prepare('SELECT * FROM task_tags').all(),
        templates: db.prepare('SELECT * FROM task_templates').all(),
        aiSettings: db.prepare('SELECT * FROM ai_settings WHERE id = 1').get(),
      },
    };

    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  });

  ipcMain.handle('data:import', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return false;

    const result = await dialog.showOpenDialog(win, {
      title: 'Import Data',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) return false;

    const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
    const imported = JSON.parse(raw);

    // Basic validation
    if (!imported.app || imported.app !== 'Sonic Flow' || !imported.data) {
      throw new Error('Invalid Sonic Flow export file');
    }

    // Create backup before import
    const dbPath = path.join(app.getPath('userData'), 'sonic-flow.db');
    const backupPath = path.join(app.getPath('userData'), `sonic-flow-backup-${formatTimestamp()}.db`);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
    }

    const data = imported.data;

    // Import within a transaction
    const importAll = db.transaction(() => {
      // Clear all tables
      db.exec(`
        DELETE FROM task_tags;
        DELETE FROM tags;
        DELETE FROM task_templates;
        DELETE FROM timer_sessions;
        DELETE FROM sound_settings;
        DELETE FROM sound_presets;
        DELETE FROM memos;
        DELETE FROM tasks;
      `);

      // Import tasks
      if (Array.isArray(data.tasks)) {
        const insertTask = db.prepare(`
          INSERT INTO tasks (id, type, title, parent_id, "order", status, is_expanded, is_deleted, deleted_at, created_at, completed_at, scheduled_at, content, work_duration_minutes, color)
          VALUES (@id, @type, @title, @parent_id, @"order", @status, @is_expanded, @is_deleted, @deleted_at, @created_at, @completed_at, @scheduled_at, @content, @work_duration_minutes, @color)
        `);
        for (const t of data.tasks) {
          insertTask.run(t);
        }
      }

      // Import timer settings
      if (data.timerSettings) {
        const ts = data.timerSettings;
        db.prepare(`
          UPDATE timer_settings SET work_duration=@work_duration, break_duration=@break_duration,
          long_break_duration=@long_break_duration, sessions_before_long_break=@sessions_before_long_break,
          updated_at=@updated_at WHERE id=1
        `).run(ts);
      }

      // Import timer sessions
      if (Array.isArray(data.timerSessions)) {
        const insertSession = db.prepare(`
          INSERT INTO timer_sessions (id, task_id, session_type, started_at, completed_at, duration, completed)
          VALUES (@id, @task_id, @session_type, @started_at, @completed_at, @duration, @completed)
        `);
        for (const s of data.timerSessions) {
          insertSession.run(s);
        }
      }

      // Import sound settings
      if (Array.isArray(data.soundSettings)) {
        const insertSound = db.prepare(`
          INSERT INTO sound_settings (id, sound_type, volume, enabled, updated_at)
          VALUES (@id, @sound_type, @volume, @enabled, @updated_at)
        `);
        for (const s of data.soundSettings) {
          insertSound.run(s);
        }
      }

      // Import sound presets
      if (Array.isArray(data.soundPresets)) {
        const insertPreset = db.prepare(`
          INSERT INTO sound_presets (id, name, settings_json, created_at)
          VALUES (@id, @name, @settings_json, @created_at)
        `);
        for (const p of data.soundPresets) {
          insertPreset.run(p);
        }
      }

      // Import memos
      if (Array.isArray(data.memos)) {
        const insertMemo = db.prepare(`
          INSERT INTO memos (id, date, content, created_at, updated_at)
          VALUES (@id, @date, @content, @created_at, @updated_at)
        `);
        for (const m of data.memos) {
          insertMemo.run(m);
        }
      }

      // Import tags
      if (Array.isArray(data.tags)) {
        const insertTag = db.prepare(`INSERT INTO tags (id, name, color) VALUES (@id, @name, @color)`);
        for (const t of data.tags) {
          insertTag.run(t);
        }
      }

      // Import task_tags
      if (Array.isArray(data.taskTags)) {
        const insertTaskTag = db.prepare(`INSERT INTO task_tags (task_id, tag_id) VALUES (@task_id, @tag_id)`);
        for (const tt of data.taskTags) {
          insertTaskTag.run(tt);
        }
      }

      // Import templates
      if (Array.isArray(data.templates)) {
        const insertTemplate = db.prepare(`
          INSERT INTO task_templates (id, name, nodes_json, created_at)
          VALUES (@id, @name, @nodes_json, @created_at)
        `);
        for (const t of data.templates) {
          insertTemplate.run(t);
        }
      }

      // Import AI settings
      if (data.aiSettings) {
        const ai = data.aiSettings;
        db.prepare(`
          UPDATE ai_settings SET api_key=@api_key, model=@model, updated_at=@updated_at WHERE id=1
        `).run(ai);
      }
    });

    importAll();
    return true;
  });
}

function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}
