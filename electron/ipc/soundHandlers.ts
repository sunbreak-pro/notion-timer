import { ipcMain } from 'electron';
import log from '../logger';
import type { SoundRepository } from '../database/soundRepository';

export function registerSoundHandlers(repo: SoundRepository): void {
  ipcMain.handle('db:sound:fetchSettings', () => {
    try { return repo.fetchSettings(); }
    catch (e) { log.error('[Sound] fetchSettings failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:updateSetting', (_event, soundType: string, volume: number, enabled: boolean) => {
    try { return repo.updateSetting(soundType, volume, enabled); }
    catch (e) { log.error('[Sound] updateSetting failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:fetchPresets', () => {
    try { return repo.fetchPresets(); }
    catch (e) { log.error('[Sound] fetchPresets failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:createPreset', (_event, name: string, settingsJson: string) => {
    try { return repo.createPreset(name, settingsJson); }
    catch (e) { log.error('[Sound] createPreset failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:deletePreset', (_event, id: number) => {
    try { repo.deletePreset(id); }
    catch (e) { log.error('[Sound] deletePreset failed:', e); throw e; }
  });

  // Sound tags
  ipcMain.handle('db:sound:fetchAllSoundTags', () => {
    try { return repo.fetchAllSoundTags(); }
    catch (e) { log.error('[Sound] fetchAllSoundTags failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:createSoundTag', (_event, name: string, color: string) => {
    try { return repo.createSoundTag(name, color); }
    catch (e) { log.error('[Sound] createSoundTag failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:updateSoundTag', (_event, id: number, name?: string, color?: string) => {
    try { return repo.updateSoundTag(id, name, color); }
    catch (e) { log.error('[Sound] updateSoundTag failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:deleteSoundTag', (_event, id: number) => {
    try { repo.deleteSoundTag(id); }
    catch (e) { log.error('[Sound] deleteSoundTag failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:fetchTagsForSound', (_event, soundId: string) => {
    try { return repo.fetchTagsForSound(soundId); }
    catch (e) { log.error('[Sound] fetchTagsForSound failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:setTagsForSound', (_event, soundId: string, tagIds: number[]) => {
    try { repo.setTagsForSound(soundId, tagIds); }
    catch (e) { log.error('[Sound] setTagsForSound failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:fetchAllSoundTagAssignments', () => {
    try { return repo.fetchAllSoundTagAssignments(); }
    catch (e) { log.error('[Sound] fetchAllSoundTagAssignments failed:', e); throw e; }
  });

  // Sound display meta
  ipcMain.handle('db:sound:fetchAllSoundDisplayMeta', () => {
    try { return repo.fetchAllSoundDisplayMeta(); }
    catch (e) { log.error('[Sound] fetchAllSoundDisplayMeta failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:updateSoundDisplayMeta', (_event, soundId: string, displayName: string) => {
    try { repo.updateSoundDisplayMeta(soundId, displayName); }
    catch (e) { log.error('[Sound] updateSoundDisplayMeta failed:', e); throw e; }
  });

  // Workscreen selections
  ipcMain.handle('db:sound:fetchWorkscreenSelections', () => {
    try { return repo.fetchWorkscreenSelections(); }
    catch (e) { log.error('[Sound] fetchWorkscreenSelections failed:', e); throw e; }
  });

  ipcMain.handle('db:sound:setWorkscreenSelections', (_event, soundIds: string[]) => {
    try { repo.setWorkscreenSelections(soundIds); }
    catch (e) { log.error('[Sound] setWorkscreenSelections failed:', e); throw e; }
  });
}
