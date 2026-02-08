import type { TaskNode } from '../../types/taskTree';
import { CalendarTaskItem } from './CalendarTaskItem';

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskNode[];
  onSelectTask: (taskId: string) => void;
}

const MAX_VISIBLE_TASKS = 2;

export function DayCell({ date, isCurrentMonth, isToday, tasks, onSelectTask }: DayCellProps) {
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS);
  const remainingCount = tasks.length - MAX_VISIBLE_TASKS;

  return (
    <div
      className={`min-h-[100px] border border-notion-border p-1.5 ${
        isCurrentMonth ? 'bg-notion-bg' : 'bg-notion-bg-secondary/50'
      }`}
    >
      <div
        className={`text-xs mb-1 ${
          isToday
            ? 'w-6 h-6 flex items-center justify-center rounded-full bg-notion-accent text-white font-bold'
            : isCurrentMonth
            ? 'text-notion-text'
            : 'text-notion-text-secondary/50'
        }`}
      >
        {date.getDate()}
      </div>
      <div className="space-y-0.5">
        {visibleTasks.map(task => (
          <CalendarTaskItem
            key={task.id}
            task={task}
            onClick={() => onSelectTask(task.id)}
          />
        ))}
        {remainingCount > 0 && (
          <p className="text-xs text-notion-text-secondary px-1">
            +{remainingCount} more
          </p>
        )}
      </div>
    </div>
  );
}
