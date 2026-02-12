import type Database from 'better-sqlite3';

export interface PomodoroPresetRow {
  id: number;
  name: string;
  work_duration: number;
  break_duration: number;
  long_break_duration: number;
  sessions_before_long_break: number;
  created_at: string;
}

export interface PomodoroPreset {
  id: number;
  name: string;
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  createdAt: string;
}

function rowToObj(row: PomodoroPresetRow): PomodoroPreset {
  return {
    id: row.id,
    name: row.name,
    workDuration: row.work_duration,
    breakDuration: row.break_duration,
    longBreakDuration: row.long_break_duration,
    sessionsBeforeLongBreak: row.sessions_before_long_break,
    createdAt: row.created_at,
  };
}

export function createPomodoroPresetRepository(db: Database.Database) {
  const stmts = {
    fetchAll: db.prepare('SELECT * FROM pomodoro_presets ORDER BY id'),
    create: db.prepare(`
      INSERT INTO pomodoro_presets (name, work_duration, break_duration, long_break_duration, sessions_before_long_break, created_at)
      VALUES (@name, @workDuration, @breakDuration, @longBreakDuration, @sessionsBeforeLongBreak, datetime('now'))
    `),
    update: db.prepare(`
      UPDATE pomodoro_presets SET
        name = COALESCE(@name, name),
        work_duration = COALESCE(@workDuration, work_duration),
        break_duration = COALESCE(@breakDuration, break_duration),
        long_break_duration = COALESCE(@longBreakDuration, long_break_duration),
        sessions_before_long_break = COALESCE(@sessionsBeforeLongBreak, sessions_before_long_break)
      WHERE id = @id
    `),
    delete: db.prepare('DELETE FROM pomodoro_presets WHERE id = ?'),
    fetchById: db.prepare('SELECT * FROM pomodoro_presets WHERE id = ?'),
  };

  return {
    fetchAll(): PomodoroPreset[] {
      return (stmts.fetchAll.all() as PomodoroPresetRow[]).map(rowToObj);
    },

    create(preset: Omit<PomodoroPreset, 'id' | 'createdAt'>): PomodoroPreset {
      const info = stmts.create.run(preset);
      return rowToObj(stmts.fetchById.get(info.lastInsertRowid) as PomodoroPresetRow);
    },

    update(id: number, updates: Partial<Omit<PomodoroPreset, 'id' | 'createdAt'>>): PomodoroPreset {
      stmts.update.run({ id, ...updates });
      return rowToObj(stmts.fetchById.get(id) as PomodoroPresetRow);
    },

    delete(id: number): void {
      stmts.delete.run(id);
    },
  };
}

export type PomodoroPresetRepository = ReturnType<typeof createPomodoroPresetRepository>;
