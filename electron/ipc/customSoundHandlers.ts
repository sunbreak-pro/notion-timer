import { ipcMain } from 'electron';
import type { CustomSoundRepository } from '../database/customSoundRepository';
import type { CustomSoundMeta } from '../types';

export function registerCustomSoundHandlers(repo: CustomSoundRepository): void {
  ipcMain.handle('db:customSound:fetchMetas', () => {
    return repo.fetchAllMetas();
  });

  ipcMain.handle('db:customSound:save', (_event, meta: CustomSoundMeta, data: ArrayBuffer) => {
    repo.saveMeta(meta);
    repo.saveBlob(meta.id, Buffer.from(data));
  });

  ipcMain.handle('db:customSound:load', (_event, id: string) => {
    const buf = repo.loadBlob(id);
    if (!buf) return null;
    // Convert Node Buffer to ArrayBuffer for IPC transfer
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  });

  ipcMain.handle('db:customSound:delete', (_event, id: string) => {
    repo.deleteMeta(id);
    repo.deleteBlob(id);
  });
}
