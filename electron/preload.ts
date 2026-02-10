import { contextBridge } from 'electron';

// Phase 0: Minimal API surface for Electron detection
// Phase 1+ will expand with IPC channels
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
