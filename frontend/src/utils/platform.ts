export const isMac = window.electronAPI?.platform === 'darwin';

export const modSymbol = isMac ? '⌘' : 'Ctrl';

export const modKey = isMac ? '⌘' : 'Ctrl+';

export function formatShortcut(mac: string, win: string): string {
  return isMac ? mac : win;
}
