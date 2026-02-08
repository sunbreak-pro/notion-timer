import { Play, Pause, Trash2, LucideFolderPlus, Plus } from "lucide-react";
import type { TaskNode } from "../../types/taskTree";

interface TaskNodeActionsProps {
  node: TaskNode;
  isDone: boolean;
  isTimerActive: boolean;
  makeFolder: (node: TaskNode) => void;
  makeTask: (node: TaskNode) => void;
  onPlayTask?: (node: TaskNode) => void;
  onDelete: (id: string) => void;
}

export function TaskNodeActions({
  node,
  isDone,
  isTimerActive,
  onPlayTask,
  onDelete,
  makeFolder,
  makeTask,
}: TaskNodeActionsProps) {
  return (
    <>
      {node.type === "folder" && (
        <button
          onClick={() => makeTask(node)}
          className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-success transition-opacity"
        >
          <Plus size={14} />
        </button>
      )}
      {node.type === "folder" && (
        <button
          onClick={() => makeFolder(node)}
          className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-success transition-opacity"
        >
          <LucideFolderPlus size={14} />
        </button>
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
        onClick={() => onDelete(node.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-notion-text-secondary hover:text-notion-danger transition-opacity"
      >
        <Trash2 size={14} />
      </button>
    </>
  );
}
