import type Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number;

  if (currentVersion < 1) {
    migrateV1(db);
  }
  if (currentVersion < 2) {
    migrateV2(db);
  }
  if (currentVersion < 3) {
    migrateV3(db);
  }
}

function migrateV1(db: Database.Database): void {
  db.exec(`
    -- Tasks
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('folder', 'task')),
      title TEXT NOT NULL DEFAULT '',
      parent_id TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      status TEXT CHECK(status IN ('TODO', 'DONE')),
      is_expanded INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      scheduled_at TEXT,
      content TEXT,
      work_duration_minutes INTEGER,
      color TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(is_deleted);

    -- Timer Settings (singleton)
    CREATE TABLE IF NOT EXISTS timer_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      work_duration INTEGER NOT NULL DEFAULT 25,
      break_duration INTEGER NOT NULL DEFAULT 5,
      long_break_duration INTEGER NOT NULL DEFAULT 15,
      sessions_before_long_break INTEGER NOT NULL DEFAULT 4,
      updated_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO timer_settings (id, work_duration, break_duration, long_break_duration, sessions_before_long_break, updated_at)
    VALUES (1, 25, 5, 15, 4, datetime('now'));

    -- Timer Sessions
    CREATE TABLE IF NOT EXISTS timer_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT,
      session_type TEXT NOT NULL CHECK(session_type IN ('WORK', 'BREAK', 'LONG_BREAK')),
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration INTEGER,
      completed INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_timer_sessions_task ON timer_sessions(task_id);

    -- Sound Settings
    CREATE TABLE IF NOT EXISTS sound_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sound_type TEXT NOT NULL UNIQUE,
      volume INTEGER NOT NULL DEFAULT 50,
      enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    -- Sound Presets
    CREATE TABLE IF NOT EXISTS sound_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      settings_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Memos
    CREATE TABLE IF NOT EXISTS memos (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_memos_date ON memos(date);

    -- AI Settings (singleton)
    CREATE TABLE IF NOT EXISTS ai_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      api_key TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT 'gemini-2.5-flash-lite',
      updated_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO ai_settings (id, api_key, model, updated_at)
    VALUES (1, '', 'gemini-2.5-flash-lite', datetime('now'));

    PRAGMA user_version = 1;
  `);
}

function migrateV2(db: Database.Database): void {
  db.exec(`
    -- Tags
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#808080'
    );

    CREATE TABLE IF NOT EXISTS task_tags (
      task_id TEXT NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (task_id, tag_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag_id);

    -- Task Templates
    CREATE TABLE IF NOT EXISTS task_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nodes_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    PRAGMA user_version = 2;
  `);
}

function migrateV3(db: Database.Database): void {
  db.exec(`
    -- Notes (free-form memos)
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled',
      content TEXT NOT NULL DEFAULT '',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned);

    -- Note-Tag associations
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_note_tags_note ON note_tags(note_id);
    CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag_id);

    PRAGMA user_version = 3;
  `);
}
