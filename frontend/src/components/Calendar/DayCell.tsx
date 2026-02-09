import { Plus } from "lucide-react";
import type { TaskNode } from "../../types/taskTree";
import { CalendarTaskItem } from "./CalendarTaskItem";

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskNode[];
  onSelectTask: (taskId: string) => void;
  onCreateTask?: (date: Date) => void;
  getTaskColor?: (taskId: string) => string | undefined;
  getFolderTag?: (taskId: string) => string;
}

const MAX_VISIBLE_TASKS = 3;

export function DayCell({
  date,
  isCurrentMonth,
  isToday,
  tasks,
  onSelectTask,
  onCreateTask,
  getTaskColor,
  getFolderTag,
}: DayCellProps) {
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS);
  const remainingCount = tasks.length - MAX_VISIBLE_TASKS;

  return (
    <div
      className={`group min-h-30 border border-notion-border p-1.5 ${
        isCurrentMonth ? "bg-notion-bg" : "bg-notion-bg-secondary/50"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div
          className={`text-xs ${
            isToday
              ? "w-6 h-6 flex items-center justify-center rounded-full bg-notion-accent text-white font-bold"
              : isCurrentMonth
                ? "text-notion-text"
                : "text-notion-text-secondary/50"
          }`}
        >
          {date.getDate()}
        </div>
        {onCreateTask && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateTask(date);
            }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-notion-hover text-notion-text-secondary transition-opacity"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        {visibleTasks.map((task) => (
          <CalendarTaskItem
            key={task.id}
            task={task}
            onClick={() => onSelectTask(task.id)}
            color={getTaskColor?.(task.id)}
            tag={getFolderTag?.(task.id)}
          />
        ))}
        {remainingCount > 0 && (
          <button
            className="text-xs text-notion-text-secondary px-1"
            onClick={() => onSelectTask("more")}
          >
            +{remainingCount} more
          </button>
        )}
      </div>
    </div>
  );
}
