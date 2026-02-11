import type Database from 'better-sqlite3';
import type { Tag } from '../types';

export function createTagRepository(db: Database.Database) {
  const stmts = {
    fetchAll: db.prepare(`SELECT * FROM tags ORDER BY name ASC`),
    fetchById: db.prepare(`SELECT * FROM tags WHERE id = ?`),
    insert: db.prepare(`INSERT INTO tags (name, color) VALUES (?, ?)`),
    update: db.prepare(`UPDATE tags SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?`),
    delete: db.prepare(`DELETE FROM tags WHERE id = ?`),
    fetchForTask: db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN task_tags tt ON t.id = tt.tag_id
      WHERE tt.task_id = ?
      ORDER BY t.name ASC
    `),
    clearTaskTags: db.prepare(`DELETE FROM task_tags WHERE task_id = ?`),
    insertTaskTag: db.prepare(`INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)`),
    removeTaskTag: db.prepare(`DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?`),
    fetchAllTaskTags: db.prepare(`SELECT task_id, tag_id FROM task_tags`),
  };

  return {
    getAll(): Tag[] {
      return stmts.fetchAll.all() as Tag[];
    },

    create(name: string, color: string): Tag {
      const info = stmts.insert.run(name, color);
      return stmts.fetchById.get(info.lastInsertRowid) as Tag;
    },

    update(id: number, name?: string, color?: string): Tag {
      stmts.update.run(name ?? null, color ?? null, id);
      const row = stmts.fetchById.get(id) as Tag | undefined;
      if (!row) throw new Error(`Tag not found: ${id}`);
      return row;
    },

    delete(id: number): void {
      stmts.delete.run(id);
    },

    getTagsForTask(taskId: string): Tag[] {
      return stmts.fetchForTask.all(taskId) as Tag[];
    },

    setTaskTags: db.transaction((taskId: string, tagIds: number[]) => {
      stmts.clearTaskTags.run(taskId);
      for (const tagId of tagIds) {
        stmts.insertTaskTag.run(taskId, tagId);
      }
    }),

    addTagToTask(taskId: string, tagId: number): void {
      stmts.insertTaskTag.run(taskId, tagId);
    },

    removeTagFromTask(taskId: string, tagId: number): void {
      stmts.removeTaskTag.run(taskId, tagId);
    },

    getAllTaskTags(): Array<{ task_id: string; tag_id: number }> {
      return stmts.fetchAllTaskTags.all() as Array<{ task_id: string; tag_id: number }>;
    },
  };
}

export type TagRepository = ReturnType<typeof createTagRepository>;
