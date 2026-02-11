import { ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from '../logger';

export function registerUpdaterHandlers(): void {
  ipcMain.handle('updater:checkForUpdates', async () => {
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      log.error('[Updater] Check failed:', e);
      throw e;
    }
  });

  ipcMain.handle('updater:downloadUpdate', async () => {
    try {
      await autoUpdater.downloadUpdate();
    } catch (e) {
      log.error('[Updater] Download failed:', e);
      throw e;
    }
  });

  ipcMain.handle('updater:installUpdate', () => {
    autoUpdater.quitAndInstall();
  });
}
