import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { SessionType } from '../types/timer';
import { TimerContext } from './TimerContextValue';
import type { ActiveTask } from './TimerContextValue';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useLocalStorage } from '../hooks/useLocalStorage';
import * as timerApi from '../api/timerClient';

interface TimerConfig {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

function deserializeMinutes(raw: string, defaultVal: number, min: number, max: number): number {
  const val = parseInt(raw, 10);
  return (val >= min && val <= max) ? val : defaultVal;
}

function sendNotification(body: string) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    const enabled = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    if (enabled === 'true') {
      new Notification('Sonic Flow', { body });
    }
  }
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
    { serialize: String, deserialize: (raw) => deserializeMinutes(raw, 25, 5, 240) }
  );

  const [breakDurationMinutes, setBreakDurationMinutesState] = useLocalStorage<number>(
    STORAGE_KEYS.BREAK_DURATION,
    5,
    { serialize: String, deserialize: (raw) => deserializeMinutes(raw, 5, 1, 60) }
  );

  const [longBreakDurationMinutes, setLongBreakDurationMinutesState] = useLocalStorage<number>(
    STORAGE_KEYS.LONG_BREAK_DURATION,
    15,
    { serialize: String, deserialize: (raw) => deserializeMinutes(raw, 15, 1, 60) }
  );

  const [sessionsBeforeLongBreakState, setSessionsBeforeLongBreakState] = useLocalStorage<number>(
    STORAGE_KEYS.SESSIONS_BEFORE_LONG_BREAK,
    4,
    { serialize: String, deserialize: (raw) => deserializeMinutes(raw, 4, 1, 20) }
  );

  const config: TimerConfig = useMemo(() => ({
    workDuration: workDurationMinutes * 60,
    breakDuration: breakDurationMinutes * 60,
    longBreakDuration: longBreakDurationMinutes * 60,
    sessionsBeforeLongBreak: sessionsBeforeLongBreakState,
  }), [workDurationMinutes, breakDurationMinutes, longBreakDurationMinutes, sessionsBeforeLongBreakState]);

  const [sessionType, setSessionType] = useState<SessionType>('WORK');
  const [remainingSeconds, setRemainingSeconds] = useState(config.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const intervalRef = useRef<number | null>(null);
  const currentSessionIdRef = useRef<number | null>(null);

  // Refs to avoid stale closures in setInterval callback
  const sessionTypeRef = useRef(sessionType);
  const completedSessionsRef = useRef(completedSessions);
  const configRef = useRef(config);
  const activeTaskRef = useRef(activeTask);
  useEffect(() => { sessionTypeRef.current = sessionType; }, [sessionType]);
  useEffect(() => { completedSessionsRef.current = completedSessions; }, [completedSessions]);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { activeTaskRef.current = activeTask; }, [activeTask]);

  // Load settings from backend on mount
  useEffect(() => {
    let cancelled = false;
    timerApi.fetchTimerSettings()
      .then((settings) => {
        if (cancelled) return;
        if (settings.workDuration) setWorkDurationMinutesState(settings.workDuration);
        if (settings.breakDuration) setBreakDurationMinutesState(settings.breakDuration);
        if (settings.longBreakDuration) setLongBreakDurationMinutesState(settings.longBreakDuration);
        if (settings.sessionsBeforeLongBreak) setSessionsBeforeLongBreakState(settings.sessionsBeforeLongBreak);
      })
      .catch(() => {
        // Backend unavailable, use localStorage values
      });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced sync settings to backend
  const syncSettingsRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(syncSettingsRef.current);
    syncSettingsRef.current = setTimeout(() => {
      timerApi.updateTimerSettings({
        workDuration: workDurationMinutes,
        breakDuration: breakDurationMinutes,
        longBreakDuration: longBreakDurationMinutes,
        sessionsBeforeLongBreak: sessionsBeforeLongBreakState,
      }).catch(() => {
        // Backend unavailable, settings remain in localStorage
      });
    }, 500);
    return () => clearTimeout(syncSettingsRef.current);
  }, [workDurationMinutes, breakDurationMinutes, longBreakDurationMinutes, sessionsBeforeLongBreakState]);

  const totalDuration = getDuration(sessionType, config);
  const progress = ((totalDuration - remainingSeconds) / totalDuration) * 100;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const endCurrentSession = useCallback((duration: number, completed: boolean) => {
    if (currentSessionIdRef.current !== null) {
      timerApi.endTimerSession(currentSessionIdRef.current, duration, completed).catch(() => {});
      currentSessionIdRef.current = null;
    }
  }, []);

  const advanceSession = useCallback(() => {
    clearTimer();
    setIsRunning(false);

    const currentSessionType = sessionTypeRef.current;
    const currentCompleted = completedSessionsRef.current;
    const currentConfig = configRef.current;

    // End current session as completed
    const completedDuration = currentSessionType === 'WORK'
      ? currentConfig.workDuration
      : currentSessionType === 'BREAK'
        ? currentConfig.breakDuration
        : currentConfig.longBreakDuration;
    endCurrentSession(completedDuration, true);

    if (currentSessionType === 'WORK') {
      const newCompleted = currentCompleted + 1;
      setCompletedSessions(newCompleted);
      if (newCompleted % currentConfig.sessionsBeforeLongBreak === 0) {
        setSessionType('LONG_BREAK');
        setRemainingSeconds(currentConfig.longBreakDuration);
        sendNotification('WORK完了！長めの休憩に入ります');
      } else {
        setSessionType('BREAK');
        setRemainingSeconds(currentConfig.breakDuration);
        sendNotification('WORK完了！休憩に入ります');
      }
    } else {
      setSessionType('WORK');
      setRemainingSeconds(currentConfig.workDuration);
      sendNotification('休憩終了！作業を再開しましょう');
    }
  }, [clearTimer, endCurrentSession]);

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

  const start = useCallback(() => {
    setIsRunning(true);
    // Record session start
    const st = sessionTypeRef.current;
    const task = activeTaskRef.current;
    timerApi.startTimerSession(st, task?.id).then((session) => {
      currentSessionIdRef.current = session.id;
    }).catch(() => {});
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    // Record partial session
    const currentConfig = configRef.current;
    const st = sessionTypeRef.current;
    const total = getDuration(st, currentConfig);
    endCurrentSession(total - remainingSeconds, false);
  }, [endCurrentSession, remainingSeconds]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    // End session if running
    endCurrentSession(0, false);
    setRemainingSeconds(getDuration(sessionType, config));
  }, [sessionType, config, clearTimer, endCurrentSession]);

  const formatTime = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const startForTask = useCallback((id: string, title: string) => {
    clearTimer();
    endCurrentSession(0, false);
    setActiveTask({ id, title });
    setSessionType('WORK');
    setRemainingSeconds(workDurationMinutes * 60);
    setIsRunning(true);
    timerApi.startTimerSession('WORK', id).then((session) => {
      currentSessionIdRef.current = session.id;
    }).catch(() => {});
  }, [clearTimer, workDurationMinutes, endCurrentSession]);

  const openForTask = useCallback((id: string, title: string, durationMinutes?: number) => {
    clearTimer();
    endCurrentSession(0, false);
    setActiveTask({ id, title });
    setSessionType('WORK');
    const dur = durationMinutes ?? workDurationMinutes;
    setRemainingSeconds(dur * 60);
    setIsRunning(false);
  }, [clearTimer, workDurationMinutes, endCurrentSession]);

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

  const setBreakDurationMinutes = useCallback((min: number) => {
    const clamped = Math.max(1, Math.min(60, min));
    setBreakDurationMinutesState(clamped);
    if (!isRunning && sessionType === 'BREAK') {
      setRemainingSeconds(clamped * 60);
    }
  }, [isRunning, sessionType, setBreakDurationMinutesState]);

  const setLongBreakDurationMinutes = useCallback((min: number) => {
    const clamped = Math.max(1, Math.min(60, min));
    setLongBreakDurationMinutesState(clamped);
    if (!isRunning && sessionType === 'LONG_BREAK') {
      setRemainingSeconds(clamped * 60);
    }
  }, [isRunning, sessionType, setLongBreakDurationMinutesState]);

  const setSessionsBeforeLongBreak = useCallback((count: number) => {
    const clamped = Math.max(1, Math.min(20, count));
    setSessionsBeforeLongBreakState(clamped);
  }, [setSessionsBeforeLongBreakState]);

  return (
    <TimerContext.Provider value={{
      sessionType,
      remainingSeconds,
      isRunning,
      completedSessions,
      progress,
      totalDuration,
      sessionsBeforeLongBreak: sessionsBeforeLongBreakState,
      workDurationMinutes,
      breakDurationMinutes,
      longBreakDurationMinutes,
      activeTask,
      start,
      pause,
      reset,
      formatTime,
      startForTask,
      openForTask,
      clearTask,
      setWorkDurationMinutes,
      setBreakDurationMinutes,
      setLongBreakDurationMinutes,
      setSessionsBeforeLongBreak,
    }}>
      {children}
    </TimerContext.Provider>
  );
}
