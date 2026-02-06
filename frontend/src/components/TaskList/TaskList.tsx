import { useState } from 'react';
import { ChevronDown, ChevronRight, Focus } from 'lucide-react';
import type { Task } from '../../types/task';
import { TaskItem } from './TaskItem';
import { TaskInput } from './TaskInput';

interface TaskListProps {
  incompleteTasks: Task[];
  completedTasks: Task[];
  onAdd: (title: string) => void;
  onToggle: (id: number) => void;
  onUpdate: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  focusMode: boolean;
  focusedTaskId: number | null;
  onFocusTask: (id: number | null) => void;
  onToggleFocusMode: () => void;
}

export function TaskList({
  incompleteTasks,
  completedTasks,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  focusMode,
  focusedTaskId,
  onFocusTask,
  onToggleFocusMode,
}: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-notion-text">Tasks</h2>
        <button
          onClick={onToggleFocusMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            focusMode
              ? 'bg-notion-accent text-white'
              : 'text-notion-text-secondary hover:bg-notion-hover'
          }`}
        >
          <Focus size={16} />
          <span>Focus Mode</span>
        </button>
      </div>

      <div className="space-y-1">
        {incompleteTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => focusMode && onFocusTask(task.id)}
          >
            <TaskItem
              task={task}
              onToggle={onToggle}
              onUpdate={(id, title) => onUpdate(id, title)}
              onDelete={onDelete}
              isFocused={focusMode && focusedTaskId === task.id}
              dimmed={focusMode && focusedTaskId !== null && focusedTaskId !== task.id}
            />
          </div>
        ))}
        <TaskInput onAdd={onAdd} />
      </div>

      {completedTasks.length > 0 && (
        <div className="pt-4 border-t border-notion-border">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-notion-text-secondary hover:text-notion-text mb-2"
          >
            {showCompleted ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Completed ({completedTasks.length})</span>
          </button>
          {showCompleted && (
            <div className="space-y-1">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onUpdate={(id, title) => onUpdate(id, title)}
                  onDelete={onDelete}
                  dimmed={focusMode}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
