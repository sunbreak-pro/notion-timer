import { ipcMain } from 'electron';
import type { PomodoroPresetRepository } from '../database/pomodoroPresetRepository';

export function registerPomodoroPresetHandlers(repo: PomodoroPresetRepository): void {
  ipcMain.handle('db:timer:fetchPomodoroPresets', () => {
    return repo.fetchAll();
  });

  ipcMain.handle('db:timer:createPomodoroPreset', (_event, preset) => {
    return repo.create(preset);
  });

  ipcMain.handle('db:timer:updatePomodoroPreset', (_event, id: number, updates) => {
    return repo.update(id, updates);
  });

  ipcMain.handle('db:timer:deletePomodoroPreset', (_event, id: number) => {
    repo.delete(id);
  });
}
