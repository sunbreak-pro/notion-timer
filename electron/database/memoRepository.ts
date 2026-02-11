import type Database from 'better-sqlite3';
import type { MemoNode } from '../types';

interface MemoRow {
  id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

function rowToNode(row: MemoRow): MemoNode {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createMemoRepository(db: Database.Database) {
  const stmts = {
    fetchAll: db.prepare(`SELECT * FROM memos ORDER BY date DESC`),
    fetchByDate: db.prepare(`SELECT * FROM memos WHERE date = ?`),
    upsert: db.prepare(`
      INSERT INTO memos (id, date, content, created_at, updated_at)
      VALUES (@id, @date, @content, datetime('now'), datetime('now'))
      ON CONFLICT(date) DO UPDATE SET
        content = @content, updated_at = datetime('now')
    `),
    delete: db.prepare(`DELETE FROM memos WHERE date = ?`),
  };

  return {
    fetchAll(): MemoNode[] {
      return (stmts.fetchAll.all() as MemoRow[]).map(rowToNode);
    },

    fetchByDate(date: string): MemoNode | null {
      const row = stmts.fetchByDate.get(date) as MemoRow | undefined;
      return row ? rowToNode(row) : null;
    },

    upsert(date: string, content: string): MemoNode {
      const id = `memo-${date}`;
      stmts.upsert.run({ id, date, content });
      const row = stmts.fetchByDate.get(date) as MemoRow;
      return rowToNode(row);
    },

    delete(date: string): void {
      stmts.delete.run(date);
    },
  };
}

export type MemoRepository = ReturnType<typeof createMemoRepository>;
