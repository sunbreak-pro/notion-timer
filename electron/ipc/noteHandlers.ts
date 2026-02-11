import { ipcMain } from 'electron';
import log from '../logger';
import type { NoteRepository } from '../database/noteRepository';

export function registerNoteHandlers(repo: NoteRepository): void {
  ipcMain.handle('db:notes:fetchAll', () => {
    try { return repo.fetchAll(); }
    catch (e) { log.error('[Notes] fetchAll failed:', e); throw e; }
  });

  ipcMain.handle('db:notes:fetchDeleted', () => {
    try { return repo.fetchDeleted(); }
    catch (e) { log.error('[Notes] fetchDeleted failed:', e); throw e; }
  });

  ipcMain.handle('db:notes:create', (_event, id: string, title: string) => {
    try { return repo.create(id, title); }
    catch (e) { log.error('[Notes] create failed:', e); throw e; }
  });

  ipcMain.handle('db:notes:update', (_event, id: string, updates: { title?: string; content?: string; isPinned?: boolean }) => {
    try { return repo.update(id, updates); }
    catch (e) { log.error('[Notes] update failed:', e); throw e; }
  });

  ipcMain.handle('db:notes:softDelete', (_event, id: string) => {
    try { repo.softDelete(id); }
    catch (e) { log.error('[Notes] softDelete failed:', e); throw e; }
  });

  ipcMain.handle('db:notes:restore', (_event, id: string) => {
    try { repo.restore(id); }
    catch (e) { log.error('[Notes] restore failed:', e); throw e; }
  });

  ipcMain.handle('db:notes:permanentDelete', (_event, id: string) => {
    try { repo.permanentDelete(id); }
    catch (e) { log.error('[Notes] permanentDelete failed:', e); throw e; }
  });

  ipcMain.handle('db:notes:search', (_event, query: string) => {
    try { return repo.search(query); }
    catch (e) { log.error('[Notes] search failed:', e); throw e; }
  });

  // Note tag handlers moved to tagHandlers.ts (db:noteTags:*)
}
