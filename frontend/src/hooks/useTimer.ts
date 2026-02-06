import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import type { TimerSettings, TimerSession, SessionType, TimerState } from '../types/timer';
import { timerApi } from '../api/timerSettings';

const DEFAULT_SETTINGS: TimerSettings = {
  id: 0,
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  updatedAt: new Date(),
};

export function useTimer() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    currentSessionType: 'WORK',
    remainingSeconds: DEFAULT_SETTINGS.workDuration * 60,
    completedSessions: 0,
    currentSessionId: null,
  });

  const intervalRef = useRef<number | null>(null);
  const currentTaskIdRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [settingsData, sessionsData] = await Promise.all([
        timerApi.getSettings(),
        timerApi.getAllSessions(),
      ]);
      setSettings(settingsData);
      setSessions(sessionsData);
      setTimerState((prev) => ({
        ...prev,
        remainingSeconds: settingsData.workDuration * 60,
      }));
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError('サーバーに接続できません。バックエンドが起動しているか確認してください。');
      } else {
        setError('タイマー設定の取得に失敗しました');
      }
      console.error('Failed to fetch timer data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Omit<TimerSettings, 'id' | 'updatedAt'>>) => {
    try {
      setError(null);
      const updatedSettings = await timerApi.updateSettings(updates);
      setSettings(updatedSettings);
      if (!timerState.isRunning) {
        const duration = getDurationForSessionType(timerState.currentSessionType, updatedSettings);
        setTimerState((prev) => ({
          ...prev,
          remainingSeconds: duration * 60,
        }));
      }
      return updatedSettings;
    } catch (err) {
      setError('タイマー設定の更新に失敗しました');
      console.error('Failed to update timer settings:', err);
      throw err;
    }
  }, [timerState.isRunning, timerState.currentSessionType]);

  const getDurationForSessionType = (type: SessionType, currentSettings: TimerSettings = settings): number => {
    switch (type) {
      case 'WORK':
        return currentSettings.workDuration;
      case 'BREAK':
        return currentSettings.breakDuration;
      case 'LONG_BREAK':
        return currentSettings.longBreakDuration;
    }
  };

  const startTimer = useCallback(async (taskId?: number) => {
    if (timerState.isRunning) return;

    try {
      setError(null);
      currentTaskIdRef.current = taskId ?? null;
      const session = await timerApi.startSession(timerState.currentSessionType, taskId);

      setTimerState((prev) => ({
        ...prev,
        isRunning: true,
        currentSessionId: session.id,
      }));

      intervalRef.current = window.setInterval(() => {
        setTimerState((prev) => {
          if (prev.remainingSeconds <= 1) {
            return { ...prev, remainingSeconds: 0 };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    } catch (err) {
      setError('タイマーの開始に失敗しました');
      console.error('Failed to start timer:', err);
    }
  }, [timerState.isRunning, timerState.currentSessionType]);

  const stopTimer = useCallback(async (completed: boolean = false) => {
    if (!timerState.isRunning || !timerState.currentSessionId) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      setError(null);
      const duration = getDurationForSessionType(timerState.currentSessionType) * 60 - timerState.remainingSeconds;
      const session = await timerApi.endSession(timerState.currentSessionId, {
        duration,
        completed,
      });

      setSessions((prev) => [session, ...prev]);

      let nextSessionType: SessionType = timerState.currentSessionType;
      let completedSessions = timerState.completedSessions;

      if (completed && timerState.currentSessionType === 'WORK') {
        completedSessions += 1;
        if (completedSessions >= settings.sessionsBeforeLongBreak) {
          nextSessionType = 'LONG_BREAK';
          completedSessions = 0;
        } else {
          nextSessionType = 'BREAK';
        }
      } else if (completed && (timerState.currentSessionType === 'BREAK' || timerState.currentSessionType === 'LONG_BREAK')) {
        nextSessionType = 'WORK';
      }

      setTimerState({
        isRunning: false,
        currentSessionType: nextSessionType,
        remainingSeconds: getDurationForSessionType(nextSessionType) * 60,
        completedSessions,
        currentSessionId: null,
      });
    } catch (err) {
      setError('タイマーの停止に失敗しました');
      console.error('Failed to stop timer:', err);
    }
  }, [timerState, settings.sessionsBeforeLongBreak]);

  useEffect(() => {
    if (timerState.isRunning && timerState.remainingSeconds === 0) {
      stopTimer(true);
    }
  }, [timerState.isRunning, timerState.remainingSeconds, stopTimer]);

  const resetTimer = useCallback(() => {
    if (timerState.isRunning) {
      stopTimer(false);
    }
    setTimerState((prev) => ({
      ...prev,
      remainingSeconds: getDurationForSessionType(prev.currentSessionType) * 60,
    }));
  }, [timerState.isRunning, stopTimer]);

  const switchSessionType = useCallback((type: SessionType) => {
    if (timerState.isRunning) return;
    setTimerState((prev) => ({
      ...prev,
      currentSessionType: type,
      remainingSeconds: getDurationForSessionType(type) * 60,
    }));
  }, [timerState.isRunning]);

  const getSessionsByTask = useCallback(async (taskId: number) => {
    try {
      return await timerApi.getSessionsByTask(taskId);
    } catch (err) {
      console.error('Failed to fetch sessions by task:', err);
      return [];
    }
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    settings,
    sessions,
    timerState,
    loading,
    error,
    updateSettings,
    startTimer,
    stopTimer,
    resetTimer,
    switchSessionType,
    getSessionsByTask,
    formatTime,
    refetch: fetchData,
  };
}
