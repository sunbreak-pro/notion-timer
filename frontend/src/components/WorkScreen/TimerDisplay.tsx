import { Play, Pause, RotateCcw } from 'lucide-react';
import type { SessionType } from '../../types/timer';

interface TimerDisplayProps {
  sessionType: SessionType;
  remainingSeconds: number;
  isRunning: boolean;
  completedSessions: number;
  sessionsBeforeLongBreak: number;
  formatTime: (s: number) => string;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const SESSION_LABELS: Record<SessionType, string> = {
  WORK: 'WORK',
  BREAK: 'BREAK',
  LONG_BREAK: 'LONG BREAK',
};

export function TimerDisplay({
  sessionType,
  remainingSeconds,
  isRunning,
  completedSessions,
  sessionsBeforeLongBreak,
  formatTime,
  onStart,
  onPause,
  onReset,
}: TimerDisplayProps) {
  const currentSession = (completedSessions % sessionsBeforeLongBreak) + 1;

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-sm font-medium tracking-widest text-notion-accent uppercase">
        {SESSION_LABELS[sessionType]}
      </span>

      <span className="text-7xl font-light text-notion-text tabular-nums tracking-tight">
        {formatTime(remainingSeconds)}
      </span>

      <div className="flex items-center gap-4">
        {isRunning ? (
          <button
            onClick={onPause}
            className="p-3 rounded-full bg-notion-hover text-notion-text hover:bg-notion-border transition-colors"
          >
            <Pause size={24} />
          </button>
        ) : (
          <button
            onClick={onStart}
            className="p-3 rounded-full bg-notion-accent text-white hover:opacity-90 transition-opacity"
          >
            <Play size={24} />
          </button>
        )}

        <button
          onClick={onReset}
          className="p-3 rounded-full bg-notion-hover text-notion-text-secondary hover:text-notion-text transition-colors"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <span className="text-sm text-notion-text-secondary">
        Session {currentSession} of {sessionsBeforeLongBreak}
      </span>
    </div>
  );
}
