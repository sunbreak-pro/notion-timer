import { ipcMain } from 'electron';
import log from '../logger';
import type { MemoRepository } from '../database/memoRepository';

export function registerMemoHandlers(repo: MemoRepository): void {
  ipcMain.handle('db:memo:fetchAll', () => {
    try { return repo.fetchAll(); }
    catch (e) { log.error('[Memo] fetchAll failed:', e); throw e; }
  });

  ipcMain.handle('db:memo:fetchByDate', (_event, date: string) => {
    try { return repo.fetchByDate(date); }
    catch (e) { log.error('[Memo] fetchByDate failed:', e); throw e; }
  });

  ipcMain.handle('db:memo:upsert', (_event, date: string, content: string) => {
    try { return repo.upsert(date, content); }
    catch (e) { log.error('[Memo] upsert failed:', e); throw e; }
  });

  ipcMain.handle('db:memo:delete', (_event, date: string) => {
    try { repo.delete(date); }
    catch (e) { log.error('[Memo] delete failed:', e); throw e; }
  });
}
