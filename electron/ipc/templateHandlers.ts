import { ipcMain } from 'electron';
import log from '../logger';
import type { TemplateRepository } from '../database/templateRepository';

export function registerTemplateHandlers(repo: TemplateRepository): void {
  ipcMain.handle('db:templates:fetchAll', () => {
    try { return repo.getAll(); }
    catch (e) { log.error('[Templates] fetchAll failed:', e); throw e; }
  });

  ipcMain.handle('db:templates:create', (_event, name: string, nodesJson: string) => {
    try { return repo.create(name, nodesJson); }
    catch (e) { log.error('[Templates] create failed:', e); throw e; }
  });

  ipcMain.handle('db:templates:getById', (_event, id: number) => {
    try { return repo.getById(id); }
    catch (e) { log.error('[Templates] getById failed:', e); throw e; }
  });

  ipcMain.handle('db:templates:delete', (_event, id: number) => {
    try { repo.delete(id); }
    catch (e) { log.error('[Templates] delete failed:', e); throw e; }
  });
}
