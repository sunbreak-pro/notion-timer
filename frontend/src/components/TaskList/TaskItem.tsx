import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, Trash2 } from 'lucide-react';
import type { Task } from '../../types/task';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onUpdate: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  isFocused?: boolean;
  dimmed?: boolean;
}

export function TaskItem({ task, onToggle, onUpdate, onDelete, isFocused, dimmed }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdate(task.id, trimmed);
    } else {
      setEditValue(task.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditValue(task.title);
      setIsEditing(false);
    }
  };

  const isDone = task.status === 'DONE';

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-notion-hover transition-all ${
        dimmed ? 'opacity-30' : ''
      } ${isFocused ? 'ring-2 ring-notion-accent' : ''}`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
          isDone
            ? 'bg-notion-accent border-notion-accent text-white'
            : 'border-notion-border hover:border-notion-accent'
        }`}
      >
        {isDone && <Check size={14} />}
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-sm text-notion-text px-1 -mx-1 border-b border-notion-accent"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 text-sm cursor-text ${
            isDone ? 'line-through text-notion-text-secondary' : 'text-notion-text'
          }`}
        >
          {task.title}
        </span>
      )}

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger transition-opacity"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
