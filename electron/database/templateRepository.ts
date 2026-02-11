import type Database from 'better-sqlite3';
import type { TaskTemplate } from '../types';

interface TemplateRow {
  id: number;
  name: string;
  nodes_json: string;
  created_at: string;
}

function rowToTemplate(row: TemplateRow): TaskTemplate {
  return {
    id: row.id,
    name: row.name,
    nodesJson: row.nodes_json,
    createdAt: row.created_at,
  };
}

export function createTemplateRepository(db: Database.Database) {
  const stmts = {
    fetchAll: db.prepare(`SELECT * FROM task_templates ORDER BY created_at DESC`),
    fetchById: db.prepare(`SELECT * FROM task_templates WHERE id = ?`),
    insert: db.prepare(`INSERT INTO task_templates (name, nodes_json, created_at) VALUES (?, ?, datetime('now'))`),
    delete: db.prepare(`DELETE FROM task_templates WHERE id = ?`),
  };

  return {
    getAll(): TaskTemplate[] {
      return (stmts.fetchAll.all() as TemplateRow[]).map(rowToTemplate);
    },

    create(name: string, nodesJson: string): TaskTemplate {
      const info = stmts.insert.run(name, nodesJson);
      const row = stmts.fetchById.get(info.lastInsertRowid) as TemplateRow;
      return rowToTemplate(row);
    },

    getById(id: number): TaskTemplate | null {
      const row = stmts.fetchById.get(id) as TemplateRow | undefined;
      return row ? rowToTemplate(row) : null;
    },

    delete(id: number): void {
      stmts.delete.run(id);
    },
  };
}

export type TemplateRepository = ReturnType<typeof createTemplateRepository>;
