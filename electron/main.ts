import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { getDatabase, closeDatabase } from './database/db';
import { registerAllHandlers } from './ipc/registerAll';
import { loadWindowState, trackWindowState } from './windowState';
import { createMenu } from './menu';

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
  // Initialize database and register IPC handlers
  const db = getDatabase();
  registerAllHandlers(db);

  const win = createWindow();
  createMenu(win);

  // macOS: re-create window on dock click when no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWin = createWindow();
      createMenu(newWin);
    }
  });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});
