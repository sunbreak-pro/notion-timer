import { useState } from 'react';
import { Play, Trash2, Clock, Minus, Plus } from 'lucide-react';
import type { TaskNode } from '../../types/taskTree';
import { getAncestors } from '../../utils/breadcrumb';

interface TaskDetailHeaderProps {
  task: TaskNode;
  allNodes: TaskNode[];
  globalWorkDuration: number;
  onPlay: () => void;
  onDelete: () => void;
  onDurationChange?: (minutes: number) => void;
}

const PRESETS = [15, 25, 30, 45, 60, 90, 120, 180, 240];

function formatDuration(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}h`;
  if (minutes > 60) return `${Math.floor(minutes / 60)}h${minutes % 60}m`;
  return `${minutes}m`;
}

export function TaskDetailHeader({
  task,
  allNodes,
  globalWorkDuration,
  onPlay,
  onDelete,
  onDurationChange,
}: TaskDetailHeaderProps) {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const ancestors = getAncestors(task.id, allNodes);
  const duration = task.workDurationMinutes ?? globalWorkDuration;
  const isCustomDuration = task.workDurationMinutes != null;

  return (
    <div className="space-y-3 pb-4 border-b border-notion-border">
      {ancestors.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-notion-text-secondary">
          {ancestors.map((ancestor, i) => (
            <span key={ancestor.id} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              <span>{ancestor.title}</span>
            </span>
          ))}
          <span>/</span>
        </div>
      )}

      <h1 className="text-2xl font-bold text-notion-text">{task.title}</h1>

      <div className="flex items-center gap-3">
        <button
          onClick={onPlay}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-notion-accent text-white hover:opacity-90 transition-opacity"
        >
          <Play size={14} />
          <span>Start</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDurationPicker(!showDurationPicker)}
            className={`flex items-center gap-1.5 text-sm px-2 py-1 rounded-md transition-colors ${
              isCustomDuration
                ? 'text-notion-accent bg-notion-accent/10'
                : 'text-notion-text-secondary hover:bg-notion-hover'
            }`}
          >
            <Clock size={14} />
            <span>{formatDuration(duration)}</span>
          </button>

          {showDurationPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-notion-bg border border-notion-border rounded-lg shadow-lg p-3 w-56">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => onDurationChange?.(Math.max(5, duration - (duration > 60 ? 15 : 5)))}
                  className="p-1 rounded-md text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-mono tabular-nums text-notion-text">
                  {formatDuration(duration)}
                </span>
                <button
                  onClick={() => onDurationChange?.(Math.min(240, duration + (duration >= 60 ? 15 : 5)))}
                  className="p-1 rounded-md text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => onDurationChange?.(preset)}
                    className={`py-1 rounded text-xs font-medium transition-colors ${
                      duration === preset
                        ? 'bg-notion-accent text-white'
                        : 'text-notion-text-secondary hover:bg-notion-hover'
                    }`}
                  >
                    {formatDuration(preset)}
                  </button>
                ))}
              </div>
              {isCustomDuration && (
                <button
                  onClick={() => {
                    onDurationChange?.(0);
                    setShowDurationPicker(false);
                  }}
                  className="w-full mt-2 py-1 text-xs text-notion-text-secondary hover:text-notion-text text-center"
                >
                  Use global default ({globalWorkDuration}m)
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-notion-text-secondary hover:text-notion-danger hover:bg-notion-hover transition-colors ml-auto"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
