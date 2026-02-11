import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { SessionType } from '../types/timer';
import { TimerContext } from './TimerContextValue';
import type { ActiveTask } from './TimerContextValue';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { getDataService } from '../services';

interface TimerConfig {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
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
  const [workDurationMinutes, setWorkDurationMinutesRaw] = useState(25);
  const [breakDurationMinutes, setBreakDurationMinutesRaw] = useState(5);
  const [longBreakDurationMinutes, setLongBreakDurationMinutesRaw] = useState(15);
  const [sessionsBeforeLongBreakState, setSessionsBeforeLongBreakRaw] = useState(4);

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

  // Load settings from DataService on mount
  useEffect(() => {
    let cancelled = false;
    getDataService().fetchTimerSettings()
      .then((settings) => {
        if (cancelled) return;
        if (settings.workDuration) setWorkDurationMinutesRaw(settings.workDuration);
        if (settings.breakDuration) setBreakDurationMinutesRaw(settings.breakDuration);
        if (settings.longBreakDuration) setLongBreakDurationMinutesRaw(settings.longBreakDuration);
        if (settings.sessionsBeforeLongBreak) setSessionsBeforeLongBreakRaw(settings.sessionsBeforeLongBreak);
      })
      .catch((e) => console.warn('[Timer] fetch settings:', e.message));
    return () => { cancelled = true; };
  }, []);

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
      getDataService().endTimerSession(currentSessionIdRef.current, duration, completed).catch((e) => console.warn('[Timer] end session:', e.message));
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
    getDataService().startTimerSession(st, task?.id).then((session) => {
      currentSessionIdRef.current = session.id;
    }).catch((e) => console.warn('[Timer] start session:', e.message));
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
    getDataService().startTimerSession('WORK', id).then((session) => {
      currentSessionIdRef.current = session.id;
    }).catch((e) => console.warn('[Timer] start session:', e.message));
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

  const updateActiveTaskTitle = useCallback((title: string) => {
    setActiveTask(prev => prev ? { ...prev, title } : null);
  }, []);

  const syncSettings = useCallback((w: number, b: number, lb: number, s: number) => {
    getDataService().updateTimerSettings({
      workDuration: w,
      breakDuration: b,
      longBreakDuration: lb,
      sessionsBeforeLongBreak: s,
    }).catch((e) => console.warn('[Timer] sync settings:', e.message));
  }, []);

  const setWorkDurationMinutes = useCallback((min: number) => {
    const clamped = Math.max(5, Math.min(240, min));
    setWorkDurationMinutesRaw(clamped);
    if (!isRunning && sessionType === 'WORK') {
      setRemainingSeconds(clamped * 60);
    }
    syncSettings(clamped, breakDurationMinutes, longBreakDurationMinutes, sessionsBeforeLongBreakState);
  }, [isRunning, sessionType, breakDurationMinutes, longBreakDurationMinutes, sessionsBeforeLongBreakState, syncSettings]);

  const setBreakDurationMinutes = useCallback((min: number) => {
    const clamped = Math.max(1, Math.min(60, min));
    setBreakDurationMinutesRaw(clamped);
    if (!isRunning && sessionType === 'BREAK') {
      setRemainingSeconds(clamped * 60);
    }
    syncSettings(workDurationMinutes, clamped, longBreakDurationMinutes, sessionsBeforeLongBreakState);
  }, [isRunning, sessionType, workDurationMinutes, longBreakDurationMinutes, sessionsBeforeLongBreakState, syncSettings]);

  const setLongBreakDurationMinutes = useCallback((min: number) => {
    const clamped = Math.max(1, Math.min(60, min));
    setLongBreakDurationMinutesRaw(clamped);
    if (!isRunning && sessionType === 'LONG_BREAK') {
      setRemainingSeconds(clamped * 60);
    }
    syncSettings(workDurationMinutes, breakDurationMinutes, clamped, sessionsBeforeLongBreakState);
  }, [isRunning, sessionType, workDurationMinutes, breakDurationMinutes, sessionsBeforeLongBreakState, syncSettings]);

  const setSessionsBeforeLongBreak = useCallback((count: number) => {
    const clamped = Math.max(1, Math.min(20, count));
    setSessionsBeforeLongBreakRaw(clamped);
    syncSettings(workDurationMinutes, breakDurationMinutes, longBreakDurationMinutes, clamped);
  }, [workDurationMinutes, breakDurationMinutes, longBreakDurationMinutes, syncSettings]);

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
      updateActiveTaskTitle,
      setWorkDurationMinutes,
      setBreakDurationMinutes,
      setLongBreakDurationMinutes,
      setSessionsBeforeLongBreak,
    }}>
      {children}
    </TimerContext.Provider>
  );
}
