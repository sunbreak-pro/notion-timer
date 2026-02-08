import { Play, Pause, Trash2 } from "lucide-react";
import type { TaskNode } from "../../types/taskTree";

interface TaskNodeActionsProps {
  node: TaskNode;
  isDone: boolean;
  isTimerActive: boolean;
  onPlayTask?: (node: TaskNode) => void;
  onDelete: (id: string) => void;
}

export function TaskNodeActions({
  node,
  isDone,
  isTimerActive,
  onPlayTask,
  onDelete,
}: TaskNodeActionsProps) {
  return (
    <>
      {!isDone && onPlayTask && (
        <button
          onClick={() => onPlayTask(node)}
          className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-accent transition-opacity"
        >
          {isTimerActive ? <Pause size={14} /> : <Play size={14} />}
        </button>
      )}
      <button
        onClick={() => onDelete(node.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger transition-opacity"
      >
        <Trash2 size={14} />
      </button>
    </>
  );
}
