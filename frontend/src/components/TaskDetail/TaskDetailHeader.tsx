import { useState } from "react";
import { Play, Trash2, Clock } from "lucide-react";
import type { TaskNode } from "../../types/taskTree";
import { getAncestors } from "../../utils/breadcrumb";
import { DurationPicker } from "../shared/DurationPicker";
import { formatDuration } from "../../utils/duration";
import { DateTimePicker } from "../Calendar/DateTimePicker";
import { FolderTag } from "../shared/FolderTag";
import { ColorPicker } from "../shared/ColorPicker";

interface TaskDetailHeaderProps {
  task: TaskNode;
  allNodes: TaskNode[];
  globalWorkDuration: number;
  onPlay: () => void;
  onDelete: () => void;
  onDurationChange?: (minutes: number) => void;
  onScheduledAtChange?: (scheduledAt: string | undefined) => void;
  onFolderColorChange?: (folderId: string, color: string) => void;
  folderTag?: string;
  taskColor?: string;
}

export function TaskDetailHeader({
  task,
  allNodes,
  globalWorkDuration,
  onPlay,
  onDelete,
  onDurationChange,
  onScheduledAtChange,
  onFolderColorChange,
  folderTag,
  taskColor,
}: TaskDetailHeaderProps) {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [colorPickerAncestorId, setColorPickerAncestorId] = useState<
    string | null
  >(null);
  const ancestors = getAncestors(task.id, allNodes);
  const duration = task.workDurationMinutes ?? globalWorkDuration;
  const isCustomDuration = task.workDurationMinutes != null;

  return (
    <div className="space-y-3 pb-4 border-b border-notion-border">
      {ancestors.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-notion-text-secondary">
            {ancestors.map((ancestor, i) => (
              <span
                key={ancestor.id}
                className="flex items-center gap-1.5 relative"
              >
                {i > 0 && <span>/</span>}
                {ancestor.type === "folder" && onFolderColorChange ? (
                  <>
                    <button
                      onClick={() =>
                        setColorPickerAncestorId(
                          colorPickerAncestorId === ancestor.id
                            ? null
                            : ancestor.id,
                        )
                      }
                      className="hover:text-notion-text transition-colors cursor-pointer"
                    >
                      <FolderTag tag={ancestor.title} color={ancestor.color} />
                    </button>
                    {colorPickerAncestorId === ancestor.id && (
                      <ColorPicker
                        currentColor={ancestor.color}
                        onSelect={(color) =>
                          onFolderColorChange(ancestor.id, color)
                        }
                        onClose={() => setColorPickerAncestorId(null)}
                      />
                    )}
                  </>
                ) : (
                  <span>{ancestor.title}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
      {!ancestors.length && folderTag && (
        <div className="flex items-center">
          <FolderTag tag={folderTag} color={taskColor} />
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
                ? "text-notion-accent bg-notion-accent/10"
                : "text-notion-text-secondary hover:bg-notion-hover"
            }`}
          >
            <Clock size={14} />
            <span>{formatDuration(duration)}</span>
          </button>

          {showDurationPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-notion-bg border border-notion-border rounded-lg shadow-lg p-3 w-56">
              <DurationPicker
                value={duration}
                onChange={(min) => onDurationChange?.(min)}
                showResetToDefault={isCustomDuration}
                onResetToDefault={() => {
                  onDurationChange?.(0);
                  setShowDurationPicker(false);
                }}
                defaultLabel={`Use global default (${globalWorkDuration}m)`}
              />
            </div>
          )}
        </div>

        <DateTimePicker
          value={task.scheduledAt}
          onChange={(val) => onScheduledAtChange?.(val)}
        />

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
