import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';
import { runMigrations } from './migrations';
import log from '../logger';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const dbPath = path.join(app.getPath('userData'), 'sonic-flow.db');
  log.info(`[DB] Opening database at: ${dbPath}`);

  try {
    db = new Database(dbPath);
  } catch (e) {
    log.error(`[DB] Failed to open database at ${dbPath}:`, e);
    throw e;
  }

  // WAL mode for better concurrent read/write performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);
  log.info('[DB] Database initialized successfully');

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
