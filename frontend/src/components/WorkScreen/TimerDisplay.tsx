import { Play, Pause, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SessionType } from "../../types/timer";

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

const SESSION_LABEL_KEYS: Record<SessionType, string> = {
  WORK: "timer.work",
  BREAK: "timer.rest",
  LONG_BREAK: "timer.longRest",
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
  const { t } = useTranslation();
  const currentSession = (completedSessions % sessionsBeforeLongBreak) + 1;

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-sm font-medium tracking-widest text-notion-accent uppercase">
        {t(SESSION_LABEL_KEYS[sessionType])}
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

      <div className="flex items-center gap-2 text-sm text-notion-text-secondary">
        <span className="tabular-nums">{currentSession}/{sessionsBeforeLongBreak}</span>
        <div className="flex gap-1">
          {Array.from({ length: sessionsBeforeLongBreak }, (_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < (completedSessions % sessionsBeforeLongBreak)
                  ? 'bg-notion-accent'
                  : i === (completedSessions % sessionsBeforeLongBreak) && sessionType === 'WORK'
                    ? 'bg-notion-accent/40'
                    : 'bg-notion-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
