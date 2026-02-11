import { ipcMain } from 'electron';
import type { TagRepository } from '../database/tagRepository';

export function registerTagHandlers(repo: TagRepository): void {
  ipcMain.handle('db:tags:fetchAll', () => {
    return repo.getAll();
  });

  ipcMain.handle('db:tags:create', (_event, name: string, color: string) => {
    return repo.create(name, color);
  });

  ipcMain.handle('db:tags:update', (_event, id: number, name?: string, color?: string) => {
    return repo.update(id, name, color);
  });

  ipcMain.handle('db:tags:delete', (_event, id: number) => {
    repo.delete(id);
  });

  ipcMain.handle('db:tags:forTask', (_event, taskId: string) => {
    return repo.getTagsForTask(taskId);
  });

  ipcMain.handle('db:tags:setForTask', (_event, taskId: string, tagIds: number[]) => {
    repo.setTaskTags(taskId, tagIds);
  });
}
