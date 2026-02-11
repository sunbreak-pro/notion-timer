import { Volume2, VolumeX, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SoundListItemProps {
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
}

function formatSeekTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SoundListItem({
  label,
  icon: Icon,
  enabled,
  volume,
  onToggle,
  onVolumeChange,
  currentTime,
  duration,
  onSeek,
}: SoundListItemProps) {
  const showSeek = enabled && onSeek && duration !== undefined && duration > 0;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
        enabled
          ? 'border-notion-accent/40 bg-notion-accent/5'
          : 'border-notion-border bg-notion-bg-secondary'
      }`}
    >
      {/* Toggle + Icon */}
      <button
        onClick={onToggle}
        className={`p-1.5 rounded-md transition-colors shrink-0 ${
          enabled
            ? 'text-notion-accent bg-notion-accent/10'
            : 'text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover'
        }`}
      >
        <Icon size={16} />
      </button>

      {/* Name */}
      <span
        className={`text-sm font-medium truncate w-16 shrink-0 ${
          enabled ? 'text-notion-text' : 'text-notion-text-secondary'
        }`}
      >
        {label}
      </span>

      {/* Volume slider */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {enabled ? (
          <Volume2 size={14} className="text-notion-text-secondary shrink-0" />
        ) : (
          <VolumeX size={14} className="text-notion-text-secondary shrink-0" />
        )}
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-20 h-1 accent-[--color-accent] cursor-pointer"
          disabled={!enabled}
        />
        <span className="text-[10px] text-notion-text-secondary w-6 text-right tabular-nums">
          {volume}
        </span>
      </div>

      {/* Seekbar */}
      {showSeek ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <Clock size={12} className="text-notion-text-secondary shrink-0" />
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime ?? 0}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="flex-1 h-1 accent-[--color-text-secondary] cursor-pointer"
          />
          <span className="text-[10px] text-notion-text-secondary tabular-nums shrink-0">
            {formatSeekTime(currentTime ?? 0)}
          </span>
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
