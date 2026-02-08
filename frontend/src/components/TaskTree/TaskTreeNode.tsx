import { useState, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Check,
  GripVertical,
} from "lucide-react";
import type { TaskNode } from "../../types/taskTree";
import { useTaskTreeContext } from "../../hooks/useTaskTreeContext";
import { useTimerContext } from "../../hooks/useTimerContext";
import { TaskNodeEditor } from "./TaskNodeEditor";
import { TaskNodeContent } from "./TaskNodeContent";
import { TaskNodeActions } from "./TaskNodeActions";
import { TaskNodeTimer, TaskNodeTimerBar } from "./TaskNodeTimer";

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

  const children = getChildren(node.id);
  const childIds = useMemo(() => children.map((c) => c.id), [children]);
  const isFolder = node.type === "folder";
  const isDone = node.type === "task" && node.status === "DONE";
  const isTimerActive = timer.activeTask?.id === node.id && timer.isRunning;
  const isSelected = node.type === "task" && selectedTaskId === node.id;

  return (
    <div>
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-center gap-0.5 rounded-md hover:bg-notion-hover transition-colors ${isSelected ? "bg-notion-hover" : ""} ${isFolder && isOver && !isDragging ? "ring-2 ring-notion-accent/50" : ""}`}
        {...attributes}
      >
        <button
          {...listeners}
          className="opacity-0 group-hover:opacity-100 p-0.5 cursor-grab text-notion-text-secondary"
        >
          <GripVertical size={18} />
        </button>

        {depth > 0 && (
          <div
            className="flex shrink-0 self-stretch"
            style={{ width: `${depth * 12}px` }}
          >
            {Array.from({ length: depth }, (_, i) => (
              <div key={i} className="w-5 flex justify-center">
                <div
                  className={`w-px h-full ${i === depth - 1 && isLastChild ? "h-1/2 self-start" : ""} bg-gray-800`}
                />
              </div>
            ))}
          </div>
        )}

        {isFolder && (
          <button
            onClick={() => toggleExpanded(node.id)}
            className="text-notion-text-secondary hover:text-notion-text"
          >
            {node.isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        )}

        {!isFolder && (
          <button
            onClick={() => toggleTaskStatus(node.id)}
            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
              isDone
                ? "bg-notion-accent border-notion-accent text-gray-900"
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
          <TaskNodeEditor
            initialValue={node.title}
            onSave={(value) => {
              updateNode(node.id, { title: value });
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <TaskNodeContent
            title={node.title}
            isDone={isDone}
            isFolder={isFolder}
            onSelectTask={onSelectTask}
            onStartEditing={() => setIsEditing(true)}
            nodeId={node.id}
          />
        )}

        <TaskNodeTimer
          isActive={isTimerActive}
          remainingSeconds={timer.remainingSeconds}
          formatTime={timer.formatTime}
        />

        <TaskNodeActions
          node={node}
          isDone={isDone}
          isTimerActive={isTimerActive}
          makeFolder={(node) => addNode("folder", node.id, "New Folder")}
          makeTask={(node) => addNode("task", node.id, "New Task")}
          onPlayTask={onPlayTask}
          onDelete={softDelete}
        />
      </div>

      <TaskNodeTimerBar
        isActive={isTimerActive}
        progress={timer.progress}
        depth={depth}
      />

      {isFolder && node.isExpanded && (
        <SortableContext
          items={childIds}
          strategy={verticalListSortingStrategy}
        >
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
          </div>
        </SortableContext>
      )}
    </div>
  );
}
