import { PanelRight } from "lucide-react";
import type { TaskNode } from "../../types/taskTree";
import { TaskTree } from "../TaskTree";

interface RightSidebarProps {
  width: number;
  onCreateFolder?: (title: string) => void;
  onCreateTask?: (title: string) => void;
  onSelectTask?: (id: string) => void;
  onPlayTask?: (node: TaskNode) => void;
  selectedTaskId?: string | null;
  onToggle: () => void;
}

export function RightSidebar({
  width,
  onSelectTask,
  onPlayTask,
  selectedTaskId,
  onToggle,
}: RightSidebarProps) {
  return (
    <div
      className="h-screen bg-notion-bg-subsidebar border-l border-notion-border flex flex-col"
      style={{ width }}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-[20px] font-semibold uppercase tracking-wider text-notion-text-secondary">
          Tasks
        </span>
        <button
          onClick={onToggle}
          className="p-1 text-notion-text-secondary hover:text-notion-text rounded transition-colors"
        >
          <PanelRight size={18} />
        </button>
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
