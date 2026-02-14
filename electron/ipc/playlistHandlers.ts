import { ipcMain } from "electron";
import log from "../logger";
import type { PlaylistRepository } from "../database/playlistRepository";

export function registerPlaylistHandlers(repo: PlaylistRepository): void {
  ipcMain.handle("db:playlists:fetchAll", () => {
    try {
      return repo.fetchAll();
    } catch (e) {
      log.error("[Playlists] fetchAll failed:", e);
      throw e;
    }
  });

  ipcMain.handle("db:playlists:create", (_event, id: string, name: string) => {
    try {
      return repo.create(id, name);
    } catch (e) {
      log.error("[Playlists] create failed:", e);
      throw e;
    }
  });

  ipcMain.handle(
    "db:playlists:update",
    (
      _event,
      id: string,
      updates: {
        name?: string;
        sortOrder?: number;
        repeatMode?: string;
        isShuffle?: boolean;
      },
    ) => {
      try {
        return repo.update(id, updates);
      } catch (e) {
        log.error("[Playlists] update failed:", e);
        throw e;
      }
    },
  );

  ipcMain.handle("db:playlists:delete", (_event, id: string) => {
    try {
      repo.delete(id);
    } catch (e) {
      log.error("[Playlists] delete failed:", e);
      throw e;
    }
  });

  ipcMain.handle("db:playlists:fetchItems", (_event, playlistId: string) => {
    try {
      return repo.fetchItems(playlistId);
    } catch (e) {
      log.error("[Playlists] fetchItems failed:", e);
      throw e;
    }
  });

  ipcMain.handle("db:playlists:fetchAllItems", () => {
    try {
      return repo.fetchAllItems();
    } catch (e) {
      log.error("[Playlists] fetchAllItems failed:", e);
      throw e;
    }
  });

  ipcMain.handle(
    "db:playlists:addItem",
    (_event, id: string, playlistId: string, soundId: string) => {
      try {
        return repo.addItem(id, playlistId, soundId);
      } catch (e) {
        log.error("[Playlists] addItem failed:", e);
        throw e;
      }
    },
  );

  ipcMain.handle("db:playlists:removeItem", (_event, itemId: string) => {
    try {
      repo.removeItem(itemId);
    } catch (e) {
      log.error("[Playlists] removeItem failed:", e);
      throw e;
    }
  });

  ipcMain.handle(
    "db:playlists:reorderItems",
    (_event, playlistId: string, itemIds: string[]) => {
      try {
        repo.reorderItems(playlistId, itemIds);
      } catch (e) {
        log.error("[Playlists] reorderItems failed:", e);
        throw e;
      }
    },
  );
}
