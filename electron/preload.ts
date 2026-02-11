import { contextBridge, ipcRenderer } from 'electron';

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
  // App
  'app:migrateFromLocalStorage',
]);

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
    if (!ALLOWED_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`IPC channel not allowed: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args) as Promise<T>;
  },
});
