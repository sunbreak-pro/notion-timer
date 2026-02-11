import { useState } from "react";
import { Settings, Minus, Plus } from "lucide-react";
import { DurationPicker } from "../shared/DurationPicker";

interface PomodoroSettingsProps {
  workDurationMinutes: number;
  breakDurationMinutes: number;
  longBreakDurationMinutes: number;
  sessionsBeforeLongBreak: number;
  onChangeWorkDuration: (min: number) => void;
  onChangeBreakDuration: (min: number) => void;
  onChangeLongBreakDuration: (min: number) => void;
  onChangeSessionsBeforeLongBreak: (count: number) => void;
  disabled: boolean;
}

export function PomodoroSettings({
  workDurationMinutes,
  breakDurationMinutes,
  longBreakDurationMinutes,
  sessionsBeforeLongBreak,
  onChangeWorkDuration,
  onChangeBreakDuration,
  onChangeLongBreakDuration,
  onChangeSessionsBeforeLongBreak,
  disabled,
}: PomodoroSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
          isOpen
            ? "bg-notion-accent/10 text-notion-accent"
            : "text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover"
        }`}
      >
        <Settings size={14} />
        ポモドーロを設定する
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-10 z-99 w-full max-w-xs space-y-4 p-4 rounded-lg border border-notion-border bg-notion-bg-secondary ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div>
            <label className="block text-sm font-medium text-notion-text-secondary mb-1">
              1セッションあたりの作業時間
            </label>
            <DurationPicker
              value={workDurationMinutes}
              onChange={onChangeWorkDuration}
              disabled={disabled}
              presets={[25, 30, 45, 55, 60]}
              min={5}
              max={240}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-notion-text-secondary mb-1">
              セッション間の休憩時間
            </label>
            <DurationPicker
              value={breakDurationMinutes}
              onChange={onChangeBreakDuration}
              disabled={disabled}
              presets={[5, 10, 15, 20, 30]}
              min={5}
              max={60}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-notion-text-secondary mb-1">
              セット間の休憩時間
            </label>
            <DurationPicker
              value={longBreakDurationMinutes}
              onChange={onChangeLongBreakDuration}
              disabled={disabled}
              presets={[10, 30, 60, 90, 120]}
              min={5}
              max={120}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-notion-text-secondary mb-1">
              １セットあたりのセッション数
            </label>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() =>
                  onChangeSessionsBeforeLongBreak(sessionsBeforeLongBreak - 1)
                }
                disabled={disabled || sessionsBeforeLongBreak <= 1}
                className="p-1 rounded-md text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover transition-colors disabled:opacity-30"
              >
                <Minus size={14} />
              </button>
              <span className="text-sm font-mono tabular-nums text-notion-text w-6 text-center">
                {sessionsBeforeLongBreak}
              </span>
              <button
                onClick={() =>
                  onChangeSessionsBeforeLongBreak(sessionsBeforeLongBreak + 1)
                }
                disabled={disabled || sessionsBeforeLongBreak >= 20}
                className="p-1 rounded-md text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover transition-colors disabled:opacity-30"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
