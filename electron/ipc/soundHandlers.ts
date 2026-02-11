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

  // Sound tags
  ipcMain.handle('db:sound:fetchAllSoundTags', () => {
    return repo.fetchAllSoundTags();
  });

  ipcMain.handle('db:sound:createSoundTag', (_event, name: string, color: string) => {
    return repo.createSoundTag(name, color);
  });

  ipcMain.handle('db:sound:updateSoundTag', (_event, id: number, name?: string, color?: string) => {
    return repo.updateSoundTag(id, name, color);
  });

  ipcMain.handle('db:sound:deleteSoundTag', (_event, id: number) => {
    repo.deleteSoundTag(id);
  });

  ipcMain.handle('db:sound:fetchTagsForSound', (_event, soundId: string) => {
    return repo.fetchTagsForSound(soundId);
  });

  ipcMain.handle('db:sound:setTagsForSound', (_event, soundId: string, tagIds: number[]) => {
    repo.setTagsForSound(soundId, tagIds);
  });

  ipcMain.handle('db:sound:fetchAllSoundTagAssignments', () => {
    return repo.fetchAllSoundTagAssignments();
  });

  // Sound display meta
  ipcMain.handle('db:sound:fetchAllSoundDisplayMeta', () => {
    return repo.fetchAllSoundDisplayMeta();
  });

  ipcMain.handle('db:sound:updateSoundDisplayMeta', (_event, soundId: string, displayName: string) => {
    repo.updateSoundDisplayMeta(soundId, displayName);
  });

  // Workscreen selections
  ipcMain.handle('db:sound:fetchWorkscreenSelections', (_event, sessionCategory: string) => {
    return repo.fetchWorkscreenSelections(sessionCategory);
  });

  ipcMain.handle('db:sound:setWorkscreenSelections', (_event, sessionCategory: string, soundIds: string[]) => {
    repo.setWorkscreenSelections(sessionCategory, soundIds);
  });
}
