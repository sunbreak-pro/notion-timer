import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { SessionType } from '../types/timer';
import { TimerContext } from './timerContextValue';
import type { ActiveTask } from './timerContextValue';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface TimerConfig {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

function deserializeWorkDuration(raw: string): number {
  const val = parseInt(raw, 10);
  return (val >= 5 && val <= 240) ? val : 25;
}

function getDuration(sessionType: SessionType, config: TimerConfig): number {
  switch (sessionType) {
    case 'WORK': return config.workDuration;
    case 'BREAK': return config.breakDuration;
    case 'LONG_BREAK': return config.longBreakDuration;
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [workDurationMinutes, setWorkDurationMinutesState] = useLocalStorage<number>(
    STORAGE_KEYS.WORK_DURATION,
    25,
    { serialize: String, deserialize: deserializeWorkDuration }
  );

  const config: TimerConfig = useMemo(() => ({
    workDuration: workDurationMinutes * 60,
    breakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    sessionsBeforeLongBreak: 4,
  }), [workDurationMinutes]);

  const [sessionType, setSessionType] = useState<SessionType>('WORK');
  const [remainingSeconds, setRemainingSeconds] = useState(config.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const intervalRef = useRef<number | null>(null);

  const totalDuration = getDuration(sessionType, config);
  const progress = ((totalDuration - remainingSeconds) / totalDuration) * 100;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advanceSession = useCallback(() => {
    clearTimer();
    setIsRunning(false);

    if (sessionType === 'WORK') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);
      if (newCompleted % config.sessionsBeforeLongBreak === 0) {
        setSessionType('LONG_BREAK');
        setRemainingSeconds(config.longBreakDuration);
      } else {
        setSessionType('BREAK');
        setRemainingSeconds(config.breakDuration);
      }
    } else {
      setSessionType('WORK');
      setRemainingSeconds(config.workDuration);
    }
  }, [sessionType, completedSessions, config, clearTimer]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          advanceSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer, advanceSession]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setRemainingSeconds(getDuration(sessionType, config));
  }, [sessionType, config, clearTimer]);

  const formatTime = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const startForTask = useCallback((id: string, title: string) => {
    clearTimer();
    setActiveTask({ id, title });
    setSessionType('WORK');
    setRemainingSeconds(workDurationMinutes * 60);
    setIsRunning(true);
  }, [clearTimer, workDurationMinutes]);

  const openForTask = useCallback((id: string, title: string, durationMinutes?: number) => {
    clearTimer();
    setActiveTask({ id, title });
    setSessionType('WORK');
    const dur = durationMinutes ?? workDurationMinutes;
    setRemainingSeconds(dur * 60);
    setIsRunning(false);
  }, [clearTimer, workDurationMinutes]);

  const clearTask = useCallback(() => {
    setActiveTask(null);
  }, []);

  const setWorkDurationMinutes = useCallback((min: number) => {
    const clamped = Math.max(5, Math.min(240, min));
    setWorkDurationMinutesState(clamped);
    if (!isRunning && sessionType === 'WORK') {
      setRemainingSeconds(clamped * 60);
    }
  }, [isRunning, sessionType, setWorkDurationMinutesState]);

  return (
    <TimerContext.Provider value={{
      sessionType,
      remainingSeconds,
      isRunning,
      completedSessions,
      progress,
      totalDuration,
      sessionsBeforeLongBreak: config.sessionsBeforeLongBreak,
      workDurationMinutes,
      activeTask,
      start,
      pause,
      reset,
      formatTime,
      startForTask,
      openForTask,
      clearTask,
      setWorkDurationMinutes,
    }}>
      {children}
    </TimerContext.Provider>
  );
}
