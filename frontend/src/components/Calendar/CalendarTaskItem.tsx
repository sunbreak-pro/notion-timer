import type { TaskNode } from '../../types/taskTree';

interface CalendarTaskItemProps {
  task: TaskNode;
  onClick: () => void;
}

export function CalendarTaskItem({ task, onClick }: CalendarTaskItemProps) {
  const isDone = task.status === 'DONE';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-colors ${
        isDone
          ? 'text-notion-text-secondary line-through bg-notion-hover/50'
          : 'text-notion-text bg-notion-accent/10 hover:bg-notion-accent/20'
      }`}
    >
      {task.title}
    </button>
  );
}
