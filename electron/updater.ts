import log from './logger';
import { autoUpdater } from 'electron-updater';
import type { BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;

function sendStatus(event: string, data?: unknown) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', { event, data });
  }
}

export function initAutoUpdater(win: BrowserWindow): void {
  mainWindow = win;

  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    log.info('[Updater] Checking for update...');
    sendStatus('checking');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('[Updater] Update available:', info.version);
    sendStatus('available', { version: info.version, releaseDate: info.releaseDate });
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('[Updater] Up to date:', info.version);
    sendStatus('not-available', { version: info.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendStatus('downloading', {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('[Updater] Update downloaded:', info.version);
    sendStatus('downloaded', { version: info.version });
  });

  autoUpdater.on('error', (error) => {
    log.error('[Updater] Error:', error);
    sendStatus('error', { message: error.message });
  });

  // Initial check after 10 seconds (non-blocking)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((e) => {
      log.error('[Updater] Initial check failed:', e);
    });
  }, 10_000);
}
