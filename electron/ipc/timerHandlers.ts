import { ipcMain } from 'electron';
import log from '../logger';
import type { TimerRepository } from '../database/timerRepository';
import type { TimerSettings, SessionType } from '../types';

export function registerTimerHandlers(repo: TimerRepository): void {
  ipcMain.handle('db:timer:fetchSettings', () => {
    try { return repo.fetchSettings(); }
    catch (e) { log.error('[Timer] fetchSettings failed:', e); throw e; }
  });

  ipcMain.handle('db:timer:updateSettings', (_event, settings: Partial<Pick<TimerSettings, 'workDuration' | 'breakDuration' | 'longBreakDuration' | 'sessionsBeforeLongBreak'>>) => {
    try { return repo.updateSettings(settings); }
    catch (e) { log.error('[Timer] updateSettings failed:', e); throw e; }
  });

  ipcMain.handle('db:timer:startSession', (_event, sessionType: SessionType, taskId: string | null) => {
    try { return repo.startSession(sessionType, taskId); }
    catch (e) { log.error('[Timer] startSession failed:', e); throw e; }
  });

  ipcMain.handle('db:timer:endSession', (_event, id: number, duration: number, completed: boolean) => {
    try { return repo.endSession(id, duration, completed); }
    catch (e) { log.error('[Timer] endSession failed:', e); throw e; }
  });

  ipcMain.handle('db:timer:fetchSessions', () => {
    try { return repo.fetchSessions(); }
    catch (e) { log.error('[Timer] fetchSessions failed:', e); throw e; }
  });

  ipcMain.handle('db:timer:fetchSessionsByTaskId', (_event, taskId: string) => {
    try { return repo.fetchSessionsByTaskId(taskId); }
    catch (e) { log.error('[Timer] fetchSessionsByTaskId failed:', e); throw e; }
  });
}
