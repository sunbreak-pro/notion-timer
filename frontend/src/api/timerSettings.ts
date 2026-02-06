import { apiClient } from './client';
import type { TimerSettings, TimerSession, SessionType } from '../types/timer';

interface TimerSettingsResponse {
  id: number;
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  updatedAt: string;
}

interface TimerSessionResponse {
  id: number;
  taskId: number | null;
  sessionType: SessionType;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  completed: boolean;
}

function mapTimerSettingsResponse(response: TimerSettingsResponse): TimerSettings {
  return {
    id: response.id,
    workDuration: response.workDuration,
    breakDuration: response.breakDuration,
    longBreakDuration: response.longBreakDuration,
    sessionsBeforeLongBreak: response.sessionsBeforeLongBreak,
    updatedAt: new Date(response.updatedAt),
  };
}

function mapTimerSessionResponse(response: TimerSessionResponse): TimerSession {
  return {
    id: response.id,
    taskId: response.taskId,
    sessionType: response.sessionType,
    startedAt: new Date(response.startedAt),
    completedAt: response.completedAt ? new Date(response.completedAt) : null,
    duration: response.duration,
    completed: response.completed,
  };
}

export const timerApi = {
  async getSettings(): Promise<TimerSettings> {
    const response = await apiClient.get<TimerSettingsResponse>('/api/timer-settings');
    return mapTimerSettingsResponse(response.data);
  },

  async updateSettings(updates: {
    workDuration?: number;
    breakDuration?: number;
    longBreakDuration?: number;
    sessionsBeforeLongBreak?: number;
  }): Promise<TimerSettings> {
    const response = await apiClient.put<TimerSettingsResponse>('/api/timer-settings', updates);
    return mapTimerSettingsResponse(response.data);
  },

  async startSession(sessionType: SessionType, taskId?: number): Promise<TimerSession> {
    const response = await apiClient.post<TimerSessionResponse>('/api/timer-sessions', {
      sessionType,
      taskId,
    });
    return mapTimerSessionResponse(response.data);
  },

  async endSession(
    id: number,
    data: { duration: number; completed: boolean }
  ): Promise<TimerSession> {
    const response = await apiClient.put<TimerSessionResponse>(`/api/timer-sessions/${id}`, data);
    return mapTimerSessionResponse(response.data);
  },

  async getAllSessions(): Promise<TimerSession[]> {
    const response = await apiClient.get<TimerSessionResponse[]>('/api/timer-sessions');
    return response.data.map(mapTimerSessionResponse);
  },

  async getSessionsByTask(taskId: number): Promise<TimerSession[]> {
    const response = await apiClient.get<TimerSessionResponse[]>(`/api/tasks/${taskId}/sessions`);
    return response.data.map(mapTimerSessionResponse);
  },
};
