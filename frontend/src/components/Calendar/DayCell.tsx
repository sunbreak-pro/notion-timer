import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import type { TaskNode } from "../../types/taskTree";
import type { MemoNode } from "../../types/memo";
import { CalendarTaskItem } from "./CalendarTaskItem";
import { useClickOutside } from "../../hooks/useClickOutside";

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskNode[];
  onSelectTask: (taskId: string, event: React.MouseEvent) => void;
  onCreateTask?: (date: Date, event: React.MouseEvent) => void;
  getTaskColor?: (taskId: string) => string | undefined;
  getFolderTag?: (taskId: string) => string;
  memo?: MemoNode;
  onSelectMemo?: (date: string) => void;
}

const MAX_VISIBLE_TASKS = 2;

export function DayCell({
  date,
  isCurrentMonth,
  isToday,
  tasks,
  onSelectTask,
  onCreateTask,
  getTaskColor,
  getFolderTag,
  memo,
  onSelectMemo,
}: DayCellProps) {
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS);
  const hiddenTasks = tasks.slice(MAX_VISIBLE_TASKS);
  const remainingCount = hiddenTasks.length;

  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const closeMore = () => setShowMore(false);
  useClickOutside(moreRef, closeMore, showMore);

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
              onCreateTask(date, e);
            }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-notion-hover text-notion-text-secondary transition-opacity"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        {memo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectMemo?.(memo.date);
            }}
            className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] truncate transition-colors hover:opacity-80"
            style={{ backgroundColor: "#FFF9C4", color: "#F59E0B" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span className="truncate font-medium">Memo</span>
          </button>
        )}
        {visibleTasks.map((task) => (
          <CalendarTaskItem
            key={task.id}
            task={task}
            onClick={(e) => onSelectTask(task.id, e)}
            color={getTaskColor?.(task.id)}
            tag={getFolderTag?.(task.id)}
          />
        ))}
        {remainingCount === 1 && (
          <CalendarTaskItem
            key={hiddenTasks[0].id}
            task={hiddenTasks[0]}
            onClick={(e) => onSelectTask(hiddenTasks[0].id, e)}
            color={getTaskColor?.(hiddenTasks[0].id)}
            tag={getFolderTag?.(hiddenTasks[0].id)}
          />
        )}
        {remainingCount >= 2 && (
          <div className="relative" ref={moreRef}>
            <button
              className="text-xs text-notion-text-secondary px-1 hover:text-notion-text transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowMore(!showMore);
              }}
            >
              +{remainingCount} more
            </button>
            {showMore && (
              <div className="absolute left-0 top-full mt-1 z-50 w-48 bg-notion-bg border border-notion-border rounded-lg shadow-lg py-1">
                {hiddenTasks.map((task) => (
                  <CalendarTaskItem
                    key={task.id}
                    task={task}
                    onClick={(e) => {
                      onSelectTask(task.id, e);
                      setShowMore(false);
                    }}
                    color={getTaskColor?.(task.id)}
                    tag={getFolderTag?.(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
