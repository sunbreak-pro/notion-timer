import type Database from "better-sqlite3";
import type { RoutineNode, RoutineLog } from "../types";

interface RoutineRow {
  id: string;
  title: string;
  frequency_type: string;
  frequency_days: string;
  is_archived: number;
  order: number;
  created_at: string;
  updated_at: string;
}

interface LogRow {
  id: number;
  routine_id: string;
  date: string;
  completed: number;
  created_at: string;
}

function rowToNode(row: RoutineRow): RoutineNode {
  return {
    id: row.id,
    title: row.title,
    frequencyType: row.frequency_type as "daily" | "custom",
    frequencyDays: JSON.parse(row.frequency_days),
    isArchived: row.is_archived === 1,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function logRowToLog(row: LogRow): RoutineLog {
  return {
    id: row.id,
    routineId: row.routine_id,
    date: row.date,
    completed: row.completed === 1,
    createdAt: row.created_at,
  };
}

export function createRoutineRepository(db: Database.Database) {
  const stmts = {
    fetchAll: db.prepare(
      `SELECT * FROM routines WHERE is_archived = 0 ORDER BY "order" ASC, created_at ASC`,
    ),
    fetchById: db.prepare(`SELECT * FROM routines WHERE id = ?`),
    insert: db.prepare(`
      INSERT INTO routines (id, title, frequency_type, frequency_days, is_archived, "order", created_at, updated_at)
      VALUES (@id, @title, @frequency_type, @frequency_days, 0, @order, datetime('now'), datetime('now'))
    `),
    update: db.prepare(`
      UPDATE routines SET title = @title, frequency_type = @frequency_type, frequency_days = @frequency_days,
      is_archived = @is_archived, "order" = @order, updated_at = datetime('now')
      WHERE id = @id
    `),
    delete: db.prepare(`DELETE FROM routines WHERE id = ?`),
    fetchLogs: db.prepare(
      `SELECT * FROM routine_logs WHERE routine_id = ? ORDER BY date DESC`,
    ),
    fetchLogsByDateRange: db.prepare(
      `SELECT * FROM routine_logs WHERE date >= ? AND date <= ? ORDER BY date ASC`,
    ),
    findLog: db.prepare(
      `SELECT * FROM routine_logs WHERE routine_id = ? AND date = ?`,
    ),
    insertLog: db.prepare(
      `INSERT INTO routine_logs (routine_id, date, completed, created_at) VALUES (?, ?, 1, datetime('now'))`,
    ),
    deleteLog: db.prepare(
      `DELETE FROM routine_logs WHERE routine_id = ? AND date = ?`,
    ),
    maxOrder: db.prepare(
      `SELECT COALESCE(MAX("order"), -1) as max_order FROM routines`,
    ),
  };

  return {
    fetchAll(): RoutineNode[] {
      return (stmts.fetchAll.all() as RoutineRow[]).map(rowToNode);
    },

    create(
      id: string,
      title: string,
      frequencyType: string,
      frequencyDays: number[],
    ): RoutineNode {
      const maxOrder = (stmts.maxOrder.get() as { max_order: number })
        .max_order;
      stmts.insert.run({
        id,
        title,
        frequency_type: frequencyType,
        frequency_days: JSON.stringify(frequencyDays),
        order: maxOrder + 1,
      });
      const row = stmts.fetchById.get(id) as RoutineRow;
      return rowToNode(row);
    },

    update(
      id: string,
      updates: Partial<
        Pick<
          RoutineNode,
          "title" | "frequencyType" | "frequencyDays" | "isArchived" | "order"
        >
      >,
    ): RoutineNode {
      const existing = stmts.fetchById.get(id) as RoutineRow | undefined;
      if (!existing) throw new Error(`Routine not found: ${id}`);
      const current = rowToNode(existing);
      stmts.update.run({
        id,
        title: updates.title ?? current.title,
        frequency_type: updates.frequencyType ?? current.frequencyType,
        frequency_days: JSON.stringify(
          updates.frequencyDays ?? current.frequencyDays,
        ),
        is_archived: (updates.isArchived ?? current.isArchived) ? 1 : 0,
        order: updates.order ?? current.order,
      });
      const row = stmts.fetchById.get(id) as RoutineRow;
      return rowToNode(row);
    },

    delete(id: string): void {
      stmts.delete.run(id);
    },

    fetchLogs(routineId: string): RoutineLog[] {
      return (stmts.fetchLogs.all(routineId) as LogRow[]).map(logRowToLog);
    },

    fetchLogsByDateRange(startDate: string, endDate: string): RoutineLog[] {
      return (
        stmts.fetchLogsByDateRange.all(startDate, endDate) as LogRow[]
      ).map(logRowToLog);
    },

    toggleLog(routineId: string, date: string): boolean {
      const existing = stmts.findLog.get(routineId, date) as LogRow | undefined;
      if (existing) {
        stmts.deleteLog.run(routineId, date);
        return false;
      } else {
        stmts.insertLog.run(routineId, date);
        return true;
      }
    },
  };
}

export type RoutineRepository = ReturnType<typeof createRoutineRepository>;
