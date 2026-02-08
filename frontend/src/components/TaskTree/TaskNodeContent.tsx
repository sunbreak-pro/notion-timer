import { useRef } from "react";

interface TaskNodeContentProps {
  title: string;
  isDone: boolean;
  isFolder: boolean;
  onSelectTask?: (id: string) => void;
  onStartEditing: () => void;
  nodeId: string;
}

export function TaskNodeContent({
  title,
  isDone,
  isFolder,
  onSelectTask,
  onStartEditing,
  nodeId,
}: TaskNodeContentProps) {
  const clickTimerRef = useRef<number | null>(null);

  return (
    <span
      onClick={() => {
        if (isFolder) {
          onStartEditing();
          return;
        }
        if (clickTimerRef.current !== null) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
          onStartEditing();
        } else {
          clickTimerRef.current = window.setTimeout(() => {
            clickTimerRef.current = null;
            if (onSelectTask) onSelectTask(nodeId);
          }, 300);
        }
      }}
      className={`flex-1 text-sm cursor-pointer truncate ${
        isDone
          ? "line-through text-notion-text-secondary"
          : "text-notion-text"
      } ${isFolder ? "font-medium" : ""}`}
    >
      {title}
    </span>
  );
}
