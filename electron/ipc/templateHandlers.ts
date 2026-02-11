import { ipcMain } from 'electron';
import type { TemplateRepository } from '../database/templateRepository';

export function registerTemplateHandlers(repo: TemplateRepository): void {
  ipcMain.handle('db:templates:fetchAll', () => {
    return repo.getAll();
  });

  ipcMain.handle('db:templates:create', (_event, name: string, nodesJson: string) => {
    return repo.create(name, nodesJson);
  });

  ipcMain.handle('db:templates:getById', (_event, id: number) => {
    return repo.getById(id);
  });

  ipcMain.handle('db:templates:delete', (_event, id: number) => {
    repo.delete(id);
  });
}
