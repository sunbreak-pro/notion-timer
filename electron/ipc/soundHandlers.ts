import { ipcMain } from 'electron';
import type { SoundRepository } from '../database/soundRepository';

export function registerSoundHandlers(repo: SoundRepository): void {
  ipcMain.handle('db:sound:fetchSettings', (_event, sessionCategory?: string) => {
    return repo.fetchSettings(sessionCategory);
  });

  ipcMain.handle('db:sound:updateSetting', (_event, soundType: string, volume: number, enabled: boolean, sessionCategory?: string) => {
    return repo.updateSetting(soundType, volume, enabled, sessionCategory);
  });

  ipcMain.handle('db:sound:fetchPresets', () => {
    return repo.fetchPresets();
  });

  ipcMain.handle('db:sound:createPreset', (_event, name: string, settingsJson: string) => {
    return repo.createPreset(name, settingsJson);
  });

  ipcMain.handle('db:sound:deletePreset', (_event, id: number) => {
    repo.deletePreset(id);
  });
}
