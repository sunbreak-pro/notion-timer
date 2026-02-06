import { useState, useRef, useCallback, useEffect } from 'react';

export type SessionType = 'WORK' | 'BREAK' | 'LONG_BREAK';

interface TimerConfig {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

const DEFAULT_CONFIG: TimerConfig = {
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
};

function getDuration(sessionType: SessionType, config: TimerConfig): number {
  switch (sessionType) {
    case 'WORK': return config.workDuration;
    case 'BREAK': return config.breakDuration;
    case 'LONG_BREAK': return config.longBreakDuration;
  }
}

export function useLocalTimer() {
  const [config] = useState(DEFAULT_CONFIG);
  const [sessionType, setSessionType] = useState<SessionType>('WORK');
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_CONFIG.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
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

  return {
    sessionType,
    remainingSeconds,
    isRunning,
    completedSessions,
    progress,
    totalDuration,
    sessionsBeforeLongBreak: config.sessionsBeforeLongBreak,
    start,
    pause,
    reset,
    formatTime,
  };
}
