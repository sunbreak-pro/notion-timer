import type Database from 'better-sqlite3';
import type { Tag } from '../types';

export function createTagRepository(db: Database.Database, type: 'task' | 'note') {
  const defTable = type === 'task' ? 'task_tag_definitions' : 'note_tag_definitions';
  const junctionTable = type === 'task' ? 'task_tags' : 'note_tags';
  const entityIdCol = type === 'task' ? 'task_id' : 'note_id';

  const stmts = {
    fetchAll: db.prepare(`SELECT * FROM ${defTable} ORDER BY name ASC`),
    fetchById: db.prepare(`SELECT * FROM ${defTable} WHERE id = ?`),
    insert: db.prepare(`INSERT INTO ${defTable} (name, color) VALUES (?, ?)`),
    update: db.prepare(`UPDATE ${defTable} SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?`),
    delete: db.prepare(`DELETE FROM ${defTable} WHERE id = ?`),
    fetchForEntity: db.prepare(`
      SELECT t.* FROM ${defTable} t
      INNER JOIN ${junctionTable} jt ON t.id = jt.tag_id
      WHERE jt.${entityIdCol} = ?
      ORDER BY t.name ASC
    `),
    clearEntityTags: db.prepare(`DELETE FROM ${junctionTable} WHERE ${entityIdCol} = ?`),
    insertEntityTag: db.prepare(`INSERT OR IGNORE INTO ${junctionTable} (${entityIdCol}, tag_id) VALUES (?, ?)`),
    removeEntityTag: db.prepare(`DELETE FROM ${junctionTable} WHERE ${entityIdCol} = ? AND tag_id = ?`),
    fetchAllEntityTags: db.prepare(`SELECT ${entityIdCol}, tag_id FROM ${junctionTable}`),
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

    getTagsForEntity(entityId: string): Tag[] {
      return stmts.fetchForEntity.all(entityId) as Tag[];
    },

    setEntityTags: db.transaction((entityId: string, tagIds: number[]) => {
      stmts.clearEntityTags.run(entityId);
      for (const tagId of tagIds) {
        stmts.insertEntityTag.run(entityId, tagId);
      }
    }),

    addTagToEntity(entityId: string, tagId: number): void {
      stmts.insertEntityTag.run(entityId, tagId);
    },

    removeTagFromEntity(entityId: string, tagId: number): void {
      stmts.removeEntityTag.run(entityId, tagId);
    },

    getAllEntityTags(): Array<{ [key: string]: string | number }> {
      return stmts.fetchAllEntityTags.all() as Array<{ [key: string]: string | number }>;
    },
  };
}

export type TagRepository = ReturnType<typeof createTagRepository>;
