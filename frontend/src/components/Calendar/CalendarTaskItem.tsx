import type { TaskNode } from '../../types/taskTree';
import { getTextColorForBg } from '../../constants/folderColors';
import { useTagContext } from '../../hooks/useTagContext';

interface CalendarTaskItemProps {
  task: TaskNode;
  onClick: () => void;
  color?: string;
  tag?: string;
}

export function CalendarTaskItem({ task, onClick, color }: CalendarTaskItemProps) {
  const isDone = task.status === 'DONE';
  const textColor = color ? getTextColorForBg(color) : undefined;
  const { getTagsForTask, taskTagsVersion } = useTagContext();
  void taskTagsVersion;
  const taskTags = getTagsForTask(task.id);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-colors flex items-center gap-1 ${
        isDone
          ? 'text-notion-text-secondary line-through bg-notion-hover/50'
          : color
            ? 'hover:opacity-80'
            : 'text-notion-text bg-notion-accent/10 hover:bg-notion-accent/20'
      }`}
      style={!isDone && color ? { backgroundColor: color, color: textColor } : undefined}
    >
      {color && !isDone && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: textColor }}
        />
      )}
      <span className="truncate">{task.title}</span>
      {taskTags.length > 0 && (
        <span className="flex gap-0.5 flex-shrink-0">
          {taskTags.slice(0, 2).map(t => (
            <span
              key={t.id}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: t.color }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
