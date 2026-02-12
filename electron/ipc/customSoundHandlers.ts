import { ipcMain } from 'electron';
import log from '../logger';
import type { CustomSoundRepository } from '../database/customSoundRepository';
import type { CustomSoundMeta } from '../types';

export function registerCustomSoundHandlers(repo: CustomSoundRepository): void {
  ipcMain.handle('db:customSound:fetchMetas', () => {
    try { return repo.fetchAllMetas(); }
    catch (e) { log.error('[CustomSound] fetchMetas failed:', e); throw e; }
  });

  ipcMain.handle('db:customSound:save', (_event, meta: CustomSoundMeta, data: ArrayBuffer) => {
    try {
      repo.saveMeta(meta);
      repo.saveBlob(meta.id, Buffer.from(data));
    } catch (e) { log.error('[CustomSound] save failed:', e); throw e; }
  });

  ipcMain.handle('db:customSound:load', (_event, id: string) => {
    try {
      const buf = repo.loadBlob(id);
      if (!buf) return null;
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    } catch (e) { log.error('[CustomSound] load failed:', e); throw e; }
  });

  ipcMain.handle('db:customSound:delete', (_event, id: string) => {
    try {
      repo.deleteMeta(id);
      repo.deleteBlob(id);
    } catch (e) { log.error('[CustomSound] delete failed:', e); throw e; }
  });
}
