import type Database from 'better-sqlite3';
import type { NoteNode, Tag } from '../types';

interface NoteRow {
  id: string;
  title: string;
  content: string;
  is_pinned: number;
  is_deleted: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToNode(row: NoteRow): NoteNode {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    isPinned: row.is_pinned === 1,
    isDeleted: row.is_deleted === 1,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createNoteRepository(db: Database.Database) {
  const stmts = {
    fetchAll: db.prepare(`SELECT * FROM notes WHERE is_deleted = 0 ORDER BY updated_at DESC`),
    fetchDeleted: db.prepare(`SELECT * FROM notes WHERE is_deleted = 1 ORDER BY deleted_at DESC`),
    fetchById: db.prepare(`SELECT * FROM notes WHERE id = ?`),
    insert: db.prepare(`
      INSERT INTO notes (id, title, content, is_pinned, is_deleted, created_at, updated_at)
      VALUES (@id, @title, '', 0, 0, datetime('now'), datetime('now'))
    `),
    update: db.prepare(`
      UPDATE notes SET title = @title, content = @content, is_pinned = @isPinned, updated_at = datetime('now')
      WHERE id = @id
    `),
    softDelete: db.prepare(`UPDATE notes SET is_deleted = 1, deleted_at = datetime('now') WHERE id = ?`),
    restore: db.prepare(`UPDATE notes SET is_deleted = 0, deleted_at = NULL WHERE id = ?`),
    permanentDelete: db.prepare(`DELETE FROM notes WHERE id = ?`),
    search: db.prepare(`
      SELECT * FROM notes WHERE is_deleted = 0
      AND (title LIKE @query OR content LIKE @query)
      ORDER BY updated_at DESC
    `),
    fetchTagsForNote: db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
      ORDER BY t.name ASC
    `),
    clearNoteTags: db.prepare(`DELETE FROM note_tags WHERE note_id = ?`),
    insertNoteTag: db.prepare(`INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)`),
    fetchAllNoteTags: db.prepare(`SELECT note_id, tag_id FROM note_tags`),
  };

  return {
    fetchAll(): NoteNode[] {
      return (stmts.fetchAll.all() as NoteRow[]).map(rowToNode);
    },

    fetchDeleted(): NoteNode[] {
      return (stmts.fetchDeleted.all() as NoteRow[]).map(rowToNode);
    },

    create(id: string, title: string): NoteNode {
      stmts.insert.run({ id, title });
      const row = stmts.fetchById.get(id) as NoteRow;
      return rowToNode(row);
    },

    update(id: string, updates: Partial<Pick<NoteNode, 'title' | 'content' | 'isPinned'>>): NoteNode {
      const existing = stmts.fetchById.get(id) as NoteRow | undefined;
      if (!existing) throw new Error(`Note not found: ${id}`);
      const current = rowToNode(existing);
      stmts.update.run({
        id,
        title: updates.title ?? current.title,
        content: updates.content ?? current.content,
        isPinned: (updates.isPinned ?? current.isPinned) ? 1 : 0,
      });
      const row = stmts.fetchById.get(id) as NoteRow;
      return rowToNode(row);
    },

    softDelete(id: string): void {
      stmts.softDelete.run(id);
    },

    restore(id: string): void {
      stmts.restore.run(id);
    },

    permanentDelete(id: string): void {
      stmts.permanentDelete.run(id);
    },

    search(query: string): NoteNode[] {
      return (stmts.search.all({ query: `%${query}%` }) as NoteRow[]).map(rowToNode);
    },

    getTagsForNote(noteId: string): Tag[] {
      return stmts.fetchTagsForNote.all(noteId) as Tag[];
    },

    setNoteTags: db.transaction((noteId: string, tagIds: number[]) => {
      stmts.clearNoteTags.run(noteId);
      for (const tagId of tagIds) {
        stmts.insertNoteTag.run(noteId, tagId);
      }
    }),

    getAllNoteTags(): Array<{ note_id: string; tag_id: number }> {
      return stmts.fetchAllNoteTags.all() as Array<{ note_id: string; tag_id: number }>;
    },
  };
}

export type NoteRepository = ReturnType<typeof createNoteRepository>;
