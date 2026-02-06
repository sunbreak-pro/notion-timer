import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Check,
  Play,
  Trash2,
  GripVertical,
} from 'lucide-react';
import type { TaskNode } from '../../types/taskTree';
import { useTaskTreeContext } from '../../hooks/useTaskTreeContext';
import { TaskTreeInput } from './TaskTreeInput';

interface TaskTreeNodeProps {
  node: TaskNode;
  depth: number;
  onPlayTask?: (node: TaskNode) => void;
}

export function TaskTreeNode({ node, depth, onPlayTask }: TaskTreeNodeProps) {
  const {
    getChildren,
    updateNode,
    toggleExpanded,
    toggleTaskStatus,
    softDelete,
    addNode,
  } = useTaskTreeContext();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== node.title) {
      updateNode(node.id, { title: trimmed });
    } else {
      setEditValue(node.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(node.title);
      setIsEditing(false);
    }
  };

  const children = getChildren(node.id);
  const isFolder = node.type === 'folder' || node.type === 'subfolder';
  const isDone = node.type === 'task' && node.status === 'DONE';

  const childPlaceholder = node.type === 'folder'
    ? '+ New subfolder or task...'
    : '+ New task...';

  return (
    <div>
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-center gap-1 px-2 py-1 rounded-md hover:bg-notion-hover transition-colors`}
        {...attributes}
      >
        <div
          style={{ width: `${depth * 20}px` }}
          className="shrink-0"
        />

        <button
          {...listeners}
          className="opacity-0 group-hover:opacity-100 p-0.5 cursor-grab text-notion-text-secondary"
        >
          <GripVertical size={14} />
        </button>

        {isFolder ? (
          <button
            onClick={() => toggleExpanded(node.id)}
            className="p-0.5 text-notion-text-secondary hover:text-notion-text"
          >
            {node.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <button
            onClick={() => toggleTaskStatus(node.id)}
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
              isDone
                ? 'bg-notion-accent border-notion-accent text-white'
                : 'border-notion-border hover:border-notion-accent'
            }`}
          >
            {isDone && <Check size={10} />}
          </button>
        )}

        {isFolder && (
          <span className="text-notion-text-secondary">
            {node.isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
          </span>
        )}

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-sm text-notion-text px-1 border-b border-notion-accent"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`flex-1 text-sm cursor-text truncate ${
              isDone ? 'line-through text-notion-text-secondary' : 'text-notion-text'
            } ${isFolder ? 'font-medium' : ''}`}
          >
            {node.title}
          </span>
        )}

        {node.type === 'task' && !isDone && onPlayTask && (
          <button
            onClick={() => onPlayTask(node)}
            className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-accent transition-opacity"
          >
            <Play size={14} />
          </button>
        )}

        <button
          onClick={() => softDelete(node.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger transition-opacity"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {isFolder && node.isExpanded && (
        <div>
          {children.map(child => (
            <TaskTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onPlayTask={onPlayTask}
            />
          ))}
          <TaskTreeInput
            placeholder={childPlaceholder}
            indent={depth + 1}
            onSubmit={(title) => {
              if (node.type === 'folder' && title.startsWith('/')) {
                addNode('subfolder', node.id, title.slice(1));
              } else {
                addNode('task', node.id, title);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
