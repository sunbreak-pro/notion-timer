import type Database from "better-sqlite3";

interface PlaylistRow {
  id: string;
  name: string;
  sort_order: number;
  repeat_mode: string;
  is_shuffle: number;
  created_at: string;
  updated_at: string;
}

interface PlaylistItemRow {
  id: string;
  playlist_id: string;
  sound_id: string;
  sort_order: number;
}

export interface PlaylistNode {
  id: string;
  name: string;
  sortOrder: number;
  repeatMode: string;
  isShuffle: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItemNode {
  id: string;
  playlistId: string;
  soundId: string;
  sortOrder: number;
}

function rowToPlaylist(row: PlaylistRow): PlaylistNode {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    repeatMode: row.repeat_mode,
    isShuffle: row.is_shuffle === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToItem(row: PlaylistItemRow): PlaylistItemNode {
  return {
    id: row.id,
    playlistId: row.playlist_id,
    soundId: row.sound_id,
    sortOrder: row.sort_order,
  };
}

export function createPlaylistRepository(db: Database.Database) {
  const stmts = {
    fetchAll: db.prepare(
      `SELECT * FROM playlists ORDER BY sort_order ASC, created_at ASC`,
    ),
    fetchById: db.prepare(`SELECT * FROM playlists WHERE id = ?`),
    insert: db.prepare(`
      INSERT INTO playlists (id, name, sort_order, repeat_mode, is_shuffle, created_at, updated_at)
      VALUES (@id, @name, @sort_order, @repeat_mode, @is_shuffle, datetime('now'), datetime('now'))
    `),
    update: db.prepare(`
      UPDATE playlists
      SET name = @name, sort_order = @sort_order, repeat_mode = @repeat_mode,
          is_shuffle = @is_shuffle, updated_at = datetime('now')
      WHERE id = @id
    `),
    delete: db.prepare(`DELETE FROM playlists WHERE id = ?`),
    maxOrder: db.prepare(
      `SELECT COALESCE(MAX(sort_order), -1) as max_order FROM playlists`,
    ),

    // Items
    fetchItems: db.prepare(
      `SELECT * FROM playlist_items WHERE playlist_id = ? ORDER BY sort_order ASC`,
    ),
    fetchAllItems: db.prepare(
      `SELECT * FROM playlist_items ORDER BY playlist_id, sort_order ASC`,
    ),
    insertItem: db.prepare(`
      INSERT INTO playlist_items (id, playlist_id, sound_id, sort_order)
      VALUES (@id, @playlist_id, @sound_id, @sort_order)
    `),
    deleteItem: db.prepare(`DELETE FROM playlist_items WHERE id = ?`),
    maxItemOrder: db.prepare(
      `SELECT COALESCE(MAX(sort_order), -1) as max_order FROM playlist_items WHERE playlist_id = ?`,
    ),
    deleteItemsByPlaylist: db.prepare(
      `DELETE FROM playlist_items WHERE playlist_id = ?`,
    ),
    updateItemOrder: db.prepare(
      `UPDATE playlist_items SET sort_order = @sort_order WHERE id = @id`,
    ),
  };

  const reorderItemsTx = db.transaction(
    (playlistId: string, itemIds: string[]) => {
      for (let i = 0; i < itemIds.length; i++) {
        stmts.updateItemOrder.run({ id: itemIds[i], sort_order: i });
      }
    },
  );

  return {
    fetchAll(): PlaylistNode[] {
      return (stmts.fetchAll.all() as PlaylistRow[]).map(rowToPlaylist);
    },

    create(id: string, name: string): PlaylistNode {
      const { max_order } = stmts.maxOrder.get() as { max_order: number };
      stmts.insert.run({
        id,
        name,
        sort_order: max_order + 1,
        repeat_mode: "all",
        is_shuffle: 0,
      });
      const row = stmts.fetchById.get(id) as PlaylistRow;
      return rowToPlaylist(row);
    },

    update(
      id: string,
      updates: Partial<
        Pick<PlaylistNode, "name" | "sortOrder" | "repeatMode" | "isShuffle">
      >,
    ): PlaylistNode {
      const existing = stmts.fetchById.get(id) as PlaylistRow | undefined;
      if (!existing) throw new Error(`Playlist not found: ${id}`);
      const current = rowToPlaylist(existing);
      stmts.update.run({
        id,
        name: updates.name ?? current.name,
        sort_order: updates.sortOrder ?? current.sortOrder,
        repeat_mode: updates.repeatMode ?? current.repeatMode,
        is_shuffle:
          updates.isShuffle !== undefined
            ? updates.isShuffle
              ? 1
              : 0
            : existing.is_shuffle,
      });
      const row = stmts.fetchById.get(id) as PlaylistRow;
      return rowToPlaylist(row);
    },

    delete(id: string): void {
      stmts.delete.run(id);
    },

    fetchItems(playlistId: string): PlaylistItemNode[] {
      return (stmts.fetchItems.all(playlistId) as PlaylistItemRow[]).map(
        rowToItem,
      );
    },

    fetchAllItems(): PlaylistItemNode[] {
      return (stmts.fetchAllItems.all() as PlaylistItemRow[]).map(rowToItem);
    },

    addItem(id: string, playlistId: string, soundId: string): PlaylistItemNode {
      const { max_order } = stmts.maxItemOrder.get(playlistId) as {
        max_order: number;
      };
      stmts.insertItem.run({
        id,
        playlist_id: playlistId,
        sound_id: soundId,
        sort_order: max_order + 1,
      });
      return { id, playlistId, soundId, sortOrder: max_order + 1 };
    },

    removeItem(itemId: string): void {
      stmts.deleteItem.run(itemId);
    },

    reorderItems(playlistId: string, itemIds: string[]): void {
      reorderItemsTx(playlistId, itemIds);
    },
  };
}

export type PlaylistRepository = ReturnType<typeof createPlaylistRepository>;
