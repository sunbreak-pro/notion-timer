import { Minus, Plus } from 'lucide-react';
import { formatDuration } from '../../utils/duration';

const DEFAULT_PRESETS = [15, 25, 30, 45, 60, 90, 120, 180, 240];
const DEFAULT_MIN = 5;
const DEFAULT_MAX = 240;

function getStep(minutes: number, direction: 'up' | 'down'): number {
  if (direction === 'up') return minutes >= 60 ? 15 : 5;
  return minutes > 60 ? 15 : 5;
}

interface DurationPickerProps {
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
  showResetToDefault?: boolean;
  onResetToDefault?: () => void;
  defaultLabel?: string;
  presets?: number[];
  min?: number;
  max?: number;
}

export function DurationPicker({
  value,
  onChange,
  disabled,
  showResetToDefault,
  onResetToDefault,
  defaultLabel,
  presets = DEFAULT_PRESETS,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
}: DurationPickerProps) {
  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onChange(Math.max(min, value - getStep(value, 'down')))}
          disabled={disabled || value <= min}
          className="p-1 rounded-md text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover transition-colors disabled:opacity-30"
        >
          <Minus size={14} />
        </button>
        <span className="text-sm font-mono tabular-nums text-notion-text">
          {formatDuration(value)}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + getStep(value, 'up')))}
          disabled={disabled || value >= max}
          className="p-1 rounded-md text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover transition-colors disabled:opacity-30"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {presets.map(preset => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            disabled={disabled}
            className={`py-0.5 rounded text-xs font-medium transition-colors ${
              value === preset
                ? 'bg-notion-accent text-white'
                : 'text-notion-text-secondary hover:bg-notion-hover hover:text-notion-text'
            }`}
          >
            {formatDuration(preset)}
          </button>
        ))}
      </div>

      {showResetToDefault && onResetToDefault && (
        <button
          onClick={onResetToDefault}
          className="w-full mt-2 py-1 text-xs text-notion-text-secondary hover:text-notion-text text-center"
        >
          {defaultLabel ?? 'Use global default'}
        </button>
      )}
    </div>
  );
}
