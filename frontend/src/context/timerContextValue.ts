import { createContext } from 'react';
import type { SessionType } from '../hooks/useLocalTimer';

export interface ActiveTask {
  id: string;
  title: string;
}

export interface TimerContextValue {
  sessionType: SessionType;
  remainingSeconds: number;
  isRunning: boolean;
  completedSessions: number;
  progress: number;
  totalDuration: number;
  sessionsBeforeLongBreak: number;
  workDurationMinutes: number;
  activeTask: ActiveTask | null;
  start: () => void;
  pause: () => void;
  reset: () => void;
  formatTime: (seconds: number) => string;
  startForTask: (id: string, title: string) => void;
  clearTask: () => void;
  setWorkDurationMinutes: (min: number) => void;
}

export const TimerContext = createContext<TimerContextValue | null>(null);
