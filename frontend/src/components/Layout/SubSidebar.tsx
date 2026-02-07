import type { TaskNode } from "../../types/taskTree";
import { TaskTree } from "../TaskTree";

interface SubSidebarProps {
  width: number;
  onCreateFolder?: (title: string) => void;
  onCreateTask?: (title: string) => void;
  onSelectTask?: (id: string) => void;
  onPlayTask?: (node: TaskNode) => void;
  selectedTaskId?: string | null;
}

export function SubSidebar({
  width,
  onSelectTask,
  onPlayTask,
  selectedTaskId,
}: SubSidebarProps) {
  return (
    <div
      className="h-screen bg-notion-bg-subsidebar border-r border-notion-border flex flex-col"
      style={{ width }}
    >
      <div className="flex items-center px-3 py-3">
        <span className="text-[18px] font-semibold uppercase tracking-wider text-notion-text-secondary">
          Tasks
        </span>
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
