import { ipcMain } from 'electron';
import type { TimerRepository } from '../database/timerRepository';
import type { TimerSettings, SessionType } from '../types';

export function registerTimerHandlers(repo: TimerRepository): void {
  ipcMain.handle('db:timer:fetchSettings', () => {
    return repo.fetchSettings();
  });

  ipcMain.handle('db:timer:updateSettings', (_event, settings: Partial<Pick<TimerSettings, 'workDuration' | 'breakDuration' | 'longBreakDuration' | 'sessionsBeforeLongBreak'>>) => {
    return repo.updateSettings(settings);
  });

  ipcMain.handle('db:timer:startSession', (_event, sessionType: SessionType, taskId: string | null) => {
    return repo.startSession(sessionType, taskId);
  });

  ipcMain.handle('db:timer:endSession', (_event, id: number, duration: number, completed: boolean) => {
    return repo.endSession(id, duration, completed);
  });

  ipcMain.handle('db:timer:fetchSessions', () => {
    return repo.fetchSessions();
  });

  ipcMain.handle('db:timer:fetchSessionsByTaskId', (_event, taskId: string) => {
    return repo.fetchSessionsByTaskId(taskId);
  });
}
