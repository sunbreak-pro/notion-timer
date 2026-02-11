import { ipcMain } from 'electron';
import type { MemoRepository } from '../database/memoRepository';

export function registerMemoHandlers(repo: MemoRepository): void {
  ipcMain.handle('db:memo:fetchAll', () => {
    return repo.fetchAll();
  });

  ipcMain.handle('db:memo:fetchByDate', (_event, date: string) => {
    return repo.fetchByDate(date);
  });

  ipcMain.handle('db:memo:upsert', (_event, date: string, content: string) => {
    return repo.upsert(date, content);
  });

  ipcMain.handle('db:memo:delete', (_event, date: string) => {
    repo.delete(date);
  });
}
