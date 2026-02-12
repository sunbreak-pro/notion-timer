import { ipcMain } from 'electron';
import log from '../logger';
import type { CalendarRepository } from '../database/calendarRepository';

export function registerCalendarHandlers(repo: CalendarRepository): void {
  ipcMain.handle('db:calendars:fetchAll', () => {
    try { return repo.fetchAll(); }
    catch (e) { log.error('[Calendars] fetchAll failed:', e); throw e; }
  });

  ipcMain.handle('db:calendars:create', (_event, id: string, title: string, folderId: string) => {
    try { return repo.create(id, title, folderId); }
    catch (e) { log.error('[Calendars] create failed:', e); throw e; }
  });

  ipcMain.handle('db:calendars:update', (_event, id: string, updates: { title?: string; folderId?: string; order?: number }) => {
    try { return repo.update(id, updates); }
    catch (e) { log.error('[Calendars] update failed:', e); throw e; }
  });

  ipcMain.handle('db:calendars:delete', (_event, id: string) => {
    try { repo.delete(id); }
    catch (e) { log.error('[Calendars] delete failed:', e); throw e; }
  });
}
