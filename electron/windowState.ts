import { app, BrowserWindow, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');
const DEFAULTS: WindowState = { x: 0, y: 0, width: 1200, height: 800, isMaximized: false };

export function loadWindowState(): WindowState {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const state: WindowState = JSON.parse(raw);

    // Validate the saved position is within a visible display
    const displays = screen.getAllDisplays();
    const visible = displays.some((d) => {
      const { x, y, width, height } = d.bounds;
      return (
        state.x >= x - 100 &&
        state.y >= y - 100 &&
        state.x < x + width &&
        state.y < y + height
      );
    });

    if (!visible) return DEFAULTS;
    return state;
  } catch {
    return DEFAULTS;
  }
}

export function trackWindowState(win: BrowserWindow): void {
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  const save = () => {
    if (win.isDestroyed()) return;
    const bounds = win.getBounds();
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: win.isMaximized(),
    };
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(state));
    } catch {
      // ignore write errors
    }
  };

  const debouncedSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(save, 500);
  };

  win.on('resize', debouncedSave);
  win.on('move', debouncedSave);
  win.on('close', save);
}
