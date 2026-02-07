import { Plus, FolderPlus } from "lucide-react";
import type { TaskNode } from "../../types/taskTree";
import { TaskTree } from "../TaskTree";

interface SubSidebarProps {
  width: number;
  onCreateFolder: (title: string) => void;
  onCreateTask?: (title: string) => void;
  onSelectTask?: (id: string) => void;
  onPlayTask?: (node: TaskNode) => void;
  selectedTaskId?: string | null;
}

export function SubSidebar({
  width,
  onCreateFolder,
  onCreateTask,
  onSelectTask,
  onPlayTask,
  selectedTaskId,
}: SubSidebarProps) {
  return (
    <div
      className="h-screen bg-notion-bg-subsidebar border-r border-notion-border flex flex-col"
      style={{ width }}
    >
      <div className="group/header flex items-center justify-between px-3 py-3">
        <span className="text-[18px] font-semibold uppercase tracking-wider text-notion-text-secondary">
          Projects
        </span>
        <div className="flex items-center gap-0.5 group-hover/header:opacity-100 transition-opacity">
          <button
            onClick={() => onCreateTask?.("New Task")}
            className="p-1.5 rounded-md text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover transition-colors"
            title="New Task"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => onCreateFolder("New Folder")}
            className="p-1.5 rounded-md text-notion-text-secondary hover:text-notion-text hover:bg-notion-hover transition-colors"
            title="New Folder"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        <TaskTree
          onPlayTask={onPlayTask}
          onSelectTask={onSelectTask}
          selectedTaskId={selectedTaskId}
        />
      </div>
    </div>
  );
}
