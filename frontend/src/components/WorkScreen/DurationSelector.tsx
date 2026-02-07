import { Minus, Plus } from 'lucide-react';

interface DurationSelectorProps {
  workDurationMinutes: number;
  onChangeDuration: (min: number) => void;
  disabled: boolean;
}

const PRESETS = [15, 25, 30, 45, 60];

export function DurationSelector({ workDurationMinutes, onChangeDuration, disabled }: DurationSelectorProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChangeDuration(workDurationMinutes - 5)}
          disabled={disabled || workDurationMinutes <= 5}
          className="p-1.5 rounded-md text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover transition-colors disabled:opacity-30"
        >
          <Minus size={16} />
        </button>

        <span className="text-lg font-mono tabular-nums text-notion-text w-12 text-center">
          {workDurationMinutes}m
        </span>

        <button
          onClick={() => onChangeDuration(workDurationMinutes + 5)}
          disabled={disabled || workDurationMinutes >= 60}
          className="p-1.5 rounded-md text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover transition-colors disabled:opacity-30"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => onChangeDuration(preset)}
            disabled={disabled}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              workDurationMinutes === preset
                ? 'bg-notion-accent text-white'
                : 'text-notion-text-secondary hover:bg-notion-hover hover:text-notion-text'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
