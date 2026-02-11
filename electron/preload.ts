import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

const ALLOWED_CHANNELS = new Set([
  // Tasks
  'db:tasks:fetchTree',
  'db:tasks:fetchDeleted',
  'db:tasks:create',
  'db:tasks:update',
  'db:tasks:syncTree',
  'db:tasks:softDelete',
  'db:tasks:restore',
  'db:tasks:permanentDelete',
  // Timer
  'db:timer:fetchSettings',
  'db:timer:updateSettings',
  'db:timer:startSession',
  'db:timer:endSession',
  'db:timer:fetchSessions',
  'db:timer:fetchSessionsByTaskId',
  // Sound
  'db:sound:fetchSettings',
  'db:sound:updateSetting',
  'db:sound:fetchPresets',
  'db:sound:createPreset',
  'db:sound:deletePreset',
  // Memo
  'db:memo:fetchAll',
  'db:memo:fetchByDate',
  'db:memo:upsert',
  'db:memo:delete',
  // Custom Sound
  'db:customSound:fetchMetas',
  'db:customSound:save',
  'db:customSound:load',
  'db:customSound:delete',
  // AI
  'ai:advice',
  'ai:fetchSettings',
  'ai:updateSettings',
  // Tags
  'db:tags:fetchAll',
  'db:tags:create',
  'db:tags:update',
  'db:tags:delete',
  'db:tags:forTask',
  'db:tags:setForTask',
  // Templates
  'db:templates:fetchAll',
  'db:templates:create',
  'db:templates:getById',
  'db:templates:delete',
  // Data I/O
  'data:export',
  'data:import',
  // App
  'app:migrateFromLocalStorage',
  // Diagnostics
  'diagnostics:fetchLogs',
  'diagnostics:openLogFolder',
  'diagnostics:exportLogs',
  'diagnostics:fetchMetrics',
  'diagnostics:resetMetrics',
  'diagnostics:fetchSystemInfo',
  // Updater
  'updater:checkForUpdates',
  'updater:downloadUpdate',
  'updater:installUpdate',
]);

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
    if (!ALLOWED_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`IPC channel not allowed: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args) as Promise<T>;
  },
  onMenuAction(callback: (action: string) => void): () => void {
    const handler = (_event: IpcRendererEvent, action: string) => callback(action);
    ipcRenderer.on('menu:action', handler);
    return () => { ipcRenderer.removeListener('menu:action', handler); };
  },
  onUpdaterStatus(callback: (status: { event: string; data?: unknown }) => void): () => void {
    const handler = (_event: IpcRendererEvent, status: { event: string; data?: unknown }) => callback(status);
    ipcRenderer.on('updater:status', handler);
    return () => { ipcRenderer.removeListener('updater:status', handler); };
  },
});
