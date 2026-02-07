import { useState, useRef, useEffect, useMemo } from "react";
import type { KeyboardEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Check,
  Play,
  Pause,
  Trash2,
  GripVertical,
} from "lucide-react";
import type { TaskNode } from "../../types/taskTree";
import { useTaskTreeContext } from "../../hooks/useTaskTreeContext";
import { useTimerContext } from "../../hooks/useTimerContext";
import { TaskTreeInput } from "./TaskTreeInput";

interface TaskTreeNodeProps {
  node: TaskNode;
  depth: number;
  isLastChild?: boolean;
  onPlayTask?: (node: TaskNode) => void;
  onSelectTask?: (id: string) => void;
  selectedTaskId?: string | null;
}

export function TaskTreeNode({
  node,
  depth,
  isLastChild,
  onPlayTask,
  onSelectTask,
  selectedTaskId,
}: TaskTreeNodeProps) {
  const {
    getChildren,
    updateNode,
    toggleExpanded,
    toggleTaskStatus,
    softDelete,
    addNode,
  } = useTaskTreeContext();

  const timer = useTimerContext();

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
    isOver,
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
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditValue(node.title);
      setIsEditing(false);
    }
  };

  const children = getChildren(node.id);
  const childIds = useMemo(() => children.map((c) => c.id), [children]);
  const isFolder = node.type === "folder" || node.type === "subfolder";
  const isDone = node.type === "task" && node.status === "DONE";
  const isTimerActive = timer.activeTask?.id === node.id && timer.isRunning;
  const isSelected = node.type === "task" && selectedTaskId === node.id;

  const childPlaceholder =
    node.type === "folder"
      ? "Type task name (/ for subfolder)"
      : "Type task name...";

  return (
    <div>
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-center gap-1 px-2 py-1 rounded-md hover:bg-notion-hover transition-colors ${isSelected ? "bg-notion-hover" : ""} ${isFolder && isOver && !isDragging ? "ring-2 ring-notion-accent/50" : ""}`}
        {...attributes}
      >
        <div className="flex shrink-0" style={{ width: `${depth * 20}px` }}>
          {Array.from({ length: depth }, (_, i) => (
            <div key={i} className="w-5 flex justify-center">
              <div
                className={`w-1 h-full ${i === depth - 1 && isLastChild ? "h-1/2 self-start" : ""} bg-notion-border`}
              />
            </div>
          ))}
        </div>

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
            {node.isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <button
            onClick={() => toggleTaskStatus(node.id)}
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
              isDone
                ? "bg-notion-accent border-notion-accent text-white"
                : "border-notion-border hover:border-notion-accent"
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
            onClick={() => {
              if (node.type === "task" && onSelectTask) {
                onSelectTask(node.id);
              } else {
                setIsEditing(true);
              }
            }}
            onDoubleClick={() => setIsEditing(true)}
            className={`flex-1 text-sm cursor-pointer truncate ${
              isDone
                ? "line-through text-notion-text-secondary"
                : "text-notion-text"
            } ${isFolder ? "font-medium" : ""}`}
          >
            {node.title}
          </span>
        )}

        {isTimerActive && (
          <span className="text-xs font-mono tabular-nums text-notion-accent shrink-0">
            {timer.formatTime(timer.remainingSeconds)}
          </span>
        )}

        {!isDone && onPlayTask && (
          <button
            onClick={() => onPlayTask(node)}
            className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-accent transition-opacity"
          >
            {isTimerActive ? <Pause size={14} /> : <Play size={14} />}
          </button>
        )}

        <button
          onClick={() => softDelete(node.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger transition-opacity"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {isTimerActive && (
        <div
          className="h-0.5 bg-notion-border rounded-full overflow-hidden"
          style={{ marginLeft: `${depth * 20 + 32}px`, marginRight: "8px" }}
        >
          <div
            className="h-full bg-notion-accent transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${timer.progress}%` }}
          />
        </div>
      )}

      {isFolder && node.isExpanded && (
        <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
          <div>
            {children.map((child, index) => (
              <TaskTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                isLastChild={index === children.length - 1}
                onPlayTask={onPlayTask}
                onSelectTask={onSelectTask}
                selectedTaskId={selectedTaskId}
              />
            ))}
            <TaskTreeInput
              placeholder={childPlaceholder}
              indent={depth + 1}
              allowFolderCreation={node.type === "folder"}
              onSubmit={(title) => addNode("task", node.id, title)}
              onSubmitFolder={
                node.type === "folder"
                  ? (title) => addNode("subfolder", node.id, title)
                  : undefined
              }
            />
          </div>
        </SortableContext>
      )}
    </div>
  );
}
