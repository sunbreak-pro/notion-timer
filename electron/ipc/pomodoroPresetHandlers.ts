import { ipcMain } from 'electron';
import log from '../logger';
import type { PomodoroPresetRepository } from '../database/pomodoroPresetRepository';

export function registerPomodoroPresetHandlers(repo: PomodoroPresetRepository): void {
  ipcMain.handle('db:timer:fetchPomodoroPresets', () => {
    try { return repo.fetchAll(); }
    catch (e) { log.error('[PomodoroPresets] fetchAll failed:', e); throw e; }
  });

  ipcMain.handle('db:timer:createPomodoroPreset', (_event, preset) => {
    try { return repo.create(preset); }
    catch (e) { log.error('[PomodoroPresets] create failed:', e); throw e; }
  });

  ipcMain.handle('db:timer:updatePomodoroPreset', (_event, id: number, updates) => {
    try { return repo.update(id, updates); }
    catch (e) { log.error('[PomodoroPresets] update failed:', e); throw e; }
  });

  ipcMain.handle('db:timer:deletePomodoroPreset', (_event, id: number) => {
    try { repo.delete(id); }
    catch (e) { log.error('[PomodoroPresets] delete failed:', e); throw e; }
  });
}
