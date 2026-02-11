import { ipcMain } from 'electron';
import type { NoteRepository } from '../database/noteRepository';

export function registerNoteHandlers(repo: NoteRepository): void {
  ipcMain.handle('db:notes:fetchAll', () => {
    return repo.fetchAll();
  });

  ipcMain.handle('db:notes:fetchDeleted', () => {
    return repo.fetchDeleted();
  });

  ipcMain.handle('db:notes:create', (_event, id: string, title: string) => {
    return repo.create(id, title);
  });

  ipcMain.handle('db:notes:update', (_event, id: string, updates: { title?: string; content?: string; isPinned?: boolean }) => {
    return repo.update(id, updates);
  });

  ipcMain.handle('db:notes:softDelete', (_event, id: string) => {
    repo.softDelete(id);
  });

  ipcMain.handle('db:notes:restore', (_event, id: string) => {
    repo.restore(id);
  });

  ipcMain.handle('db:notes:permanentDelete', (_event, id: string) => {
    repo.permanentDelete(id);
  });

  ipcMain.handle('db:notes:search', (_event, query: string) => {
    return repo.search(query);
  });

  ipcMain.handle('db:notes:tagsForNote', (_event, noteId: string) => {
    return repo.getTagsForNote(noteId);
  });

  ipcMain.handle('db:notes:setTags', (_event, noteId: string, tagIds: number[]) => {
    repo.setNoteTags(noteId, tagIds);
  });

  ipcMain.handle('db:notes:allNoteTags', () => {
    return repo.getAllNoteTags();
  });
}
