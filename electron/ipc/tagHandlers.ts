import { ipcMain } from 'electron';
import type { TagRepository } from '../database/tagRepository';

export function registerTagHandlers(taskTagRepo: TagRepository, noteTagRepo: TagRepository): void {
  // Task tags
  ipcMain.handle('db:taskTags:fetchAll', () => {
    return taskTagRepo.getAll();
  });

  ipcMain.handle('db:taskTags:create', (_event, name: string, color: string) => {
    return taskTagRepo.create(name, color);
  });

  ipcMain.handle('db:taskTags:update', (_event, id: number, name?: string, color?: string) => {
    return taskTagRepo.update(id, name, color);
  });

  ipcMain.handle('db:taskTags:delete', (_event, id: number) => {
    taskTagRepo.delete(id);
  });

  ipcMain.handle('db:taskTags:forTask', (_event, taskId: string) => {
    return taskTagRepo.getTagsForEntity(taskId);
  });

  ipcMain.handle('db:taskTags:setForTask', (_event, taskId: string, tagIds: number[]) => {
    taskTagRepo.setEntityTags(taskId, tagIds);
  });

  // Note tags
  ipcMain.handle('db:noteTags:fetchAll', () => {
    return noteTagRepo.getAll();
  });

  ipcMain.handle('db:noteTags:create', (_event, name: string, color: string) => {
    return noteTagRepo.create(name, color);
  });

  ipcMain.handle('db:noteTags:update', (_event, id: number, name?: string, color?: string) => {
    return noteTagRepo.update(id, name, color);
  });

  ipcMain.handle('db:noteTags:delete', (_event, id: number) => {
    noteTagRepo.delete(id);
  });

  ipcMain.handle('db:noteTags:forNote', (_event, noteId: string) => {
    return noteTagRepo.getTagsForEntity(noteId);
  });

  ipcMain.handle('db:noteTags:setForNote', (_event, noteId: string, tagIds: number[]) => {
    noteTagRepo.setEntityTags(noteId, tagIds);
  });

  ipcMain.handle('db:noteTags:allNoteTags', () => {
    return noteTagRepo.getAllEntityTags();
  });
}
