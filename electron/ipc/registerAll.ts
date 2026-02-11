import log from '../logger';
import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import { createTaskRepository } from '../database/taskRepository';
import { createTimerRepository } from '../database/timerRepository';
import { createSoundRepository } from '../database/soundRepository';
import { createMemoRepository } from '../database/memoRepository';
import { createAIRepository } from '../database/aiRepository';
import { createTagRepository } from '../database/tagRepository';
import { createTemplateRepository } from '../database/templateRepository';
import { registerTaskHandlers } from './taskHandlers';
import { registerTimerHandlers } from './timerHandlers';
import { registerSoundHandlers } from './soundHandlers';
import { registerMemoHandlers } from './memoHandlers';
import { registerAIHandlers } from './aiHandlers';
import { registerAppHandlers } from './appHandlers';
import { createCustomSoundRepository } from '../database/customSoundRepository';
import { registerCustomSoundHandlers } from './customSoundHandlers';
import { registerTagHandlers } from './tagHandlers';
import { registerTemplateHandlers } from './templateHandlers';
import { registerDataIOHandlers } from './dataIOHandlers';
import { registerDiagnosticsHandlers } from './diagnosticsHandlers';
import { registerUpdaterHandlers } from './updaterHandlers';
import { wrapHandler } from './ipcMetrics';

export function registerAllHandlers(db: Database.Database): void {
  const tasks = createTaskRepository(db);
  const timer = createTimerRepository(db);
  const sound = createSoundRepository(db);
  const memo = createMemoRepository(db);
  const ai = createAIRepository(db);
  const tags = createTagRepository(db);
  const templates = createTemplateRepository(db);

  try { ai.migrateDeprecatedModel(); } catch (e) { log.error('[IPC] AI migration failed:', e); }

  // Wrap ipcMain.handle to auto-instrument all handlers with metrics
  const originalHandle = ipcMain.handle.bind(ipcMain);
  ipcMain.handle = (channel: string, listener: any) => {
    return originalHandle(channel, wrapHandler(channel, listener));
  };

  const registrations: [string, () => void][] = [
    ['Tasks', () => registerTaskHandlers(tasks)],
    ['Timer', () => registerTimerHandlers(timer)],
    ['Sound', () => registerSoundHandlers(sound)],
    ['Memo', () => registerMemoHandlers(memo)],
    ['AI', () => registerAIHandlers(ai)],
    ['CustomSound', () => registerCustomSoundHandlers(createCustomSoundRepository())],
    ['Tags', () => registerTagHandlers(tags)],
    ['Templates', () => registerTemplateHandlers(templates)],
    ['App', () => registerAppHandlers({ tasks, timer, sound, memo })],
    ['DataIO', () => registerDataIOHandlers(db)],
    ['Diagnostics', () => registerDiagnosticsHandlers(db)],
    ['Updater', () => registerUpdaterHandlers()],
  ];

  for (const [name, register] of registrations) {
    try {
      register();
    } catch (e) {
      log.error(`[IPC] Failed to register ${name} handlers:`, e);
    }
  }

  // Restore original handle
  ipcMain.handle = originalHandle;
}
