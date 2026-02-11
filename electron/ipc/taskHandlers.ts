import { ipcMain } from 'electron';
import type { TaskRepository } from '../database/taskRepository';
import type { TaskNode } from '../types';

export function registerTaskHandlers(repo: TaskRepository): void {
  ipcMain.handle('db:tasks:fetchTree', () => {
    return repo.fetchTree();
  });

  ipcMain.handle('db:tasks:fetchDeleted', () => {
    return repo.fetchDeleted();
  });

  ipcMain.handle('db:tasks:create', (_event, node: TaskNode) => {
    return repo.create(node);
  });

  ipcMain.handle('db:tasks:update', (_event, id: string, updates: Partial<TaskNode>) => {
    return repo.update(id, updates);
  });

  ipcMain.handle('db:tasks:syncTree', (_event, nodes: TaskNode[]) => {
    repo.syncTree(nodes);
  });

  ipcMain.handle('db:tasks:softDelete', (_event, id: string) => {
    repo.softDelete(id);
  });

  ipcMain.handle('db:tasks:restore', (_event, id: string) => {
    repo.restore(id);
  });

  ipcMain.handle('db:tasks:permanentDelete', (_event, id: string) => {
    repo.permanentDelete(id);
  });
}
