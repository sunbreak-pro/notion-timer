import { ipcMain } from 'electron';
import log from '../logger';
import type { TaskRepository } from '../database/taskRepository';
import type { TaskNode } from '../types';

export function registerTaskHandlers(repo: TaskRepository): void {
  ipcMain.handle('db:tasks:fetchTree', () => {
    try { return repo.fetchTree(); }
    catch (e) { log.error('[Tasks] fetchTree failed:', e); throw e; }
  });

  ipcMain.handle('db:tasks:fetchDeleted', () => {
    try { return repo.fetchDeleted(); }
    catch (e) { log.error('[Tasks] fetchDeleted failed:', e); throw e; }
  });

  ipcMain.handle('db:tasks:create', (_event, node: TaskNode) => {
    try { return repo.create(node); }
    catch (e) { log.error('[Tasks] create failed:', e); throw e; }
  });

  ipcMain.handle('db:tasks:update', (_event, id: string, updates: Partial<TaskNode>) => {
    try { return repo.update(id, updates); }
    catch (e) { log.error('[Tasks] update failed:', e); throw e; }
  });

  ipcMain.handle('db:tasks:syncTree', (_event, nodes: TaskNode[]) => {
    try { repo.syncTree(nodes); }
    catch (e) { log.error('[Tasks] syncTree failed:', e); throw e; }
  });

  ipcMain.handle('db:tasks:softDelete', (_event, id: string) => {
    try { repo.softDelete(id); }
    catch (e) { log.error('[Tasks] softDelete failed:', e); throw e; }
  });

  ipcMain.handle('db:tasks:restore', (_event, id: string) => {
    try { repo.restore(id); }
    catch (e) { log.error('[Tasks] restore failed:', e); throw e; }
  });

  ipcMain.handle('db:tasks:permanentDelete', (_event, id: string) => {
    try { repo.permanentDelete(id); }
    catch (e) { log.error('[Tasks] permanentDelete failed:', e); throw e; }
  });
}
