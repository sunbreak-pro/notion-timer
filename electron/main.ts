import log from './logger';
import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import { getDatabase, closeDatabase } from './database/db';
import { registerAllHandlers } from './ipc/registerAll';
import { loadWindowState, trackWindowState } from './windowState';
import { createMenu } from './menu';
import { initAutoUpdater } from './updater';

const isDev = !app.isPackaged;

function createWindow(): BrowserWindow {
  const saved = loadWindowState();

  const win = new BrowserWindow({
    x: saved.x,
    y: saved.y,
    width: saved.width,
    height: saved.height,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 16 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (saved.isMaximized) win.maximize();

  trackWindowState(win);

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(app.getAppPath(), 'frontend', 'dist', 'index.html'));
  }

  return win;
}

app.whenReady().then(() => {
  try {
    const db = getDatabase();
    registerAllHandlers(db);
  } catch (e) {
    log.error('[Main] Failed to initialize database/handlers:', e);
    dialog.showErrorBox(
      'Sonic Flow - Database Error',
      `Failed to initialize the database. Your data will not be saved.\n\n${e instanceof Error ? e.message : String(e)}`
    );
  }

  const win = createWindow();
  createMenu(win);

  if (!isDev) {
    initAutoUpdater(win);
  }

  // macOS: re-create window on dock click when no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWin = createWindow();
      createMenu(newWin);
    }
  });
}).catch(e => log.error('[Main] app.whenReady failed:', e));

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});
