import { PanelRight, Undo2, Redo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTaskTreeContext } from "../../hooks/useTaskTreeContext";
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
  const { t } = useTranslation();
  const { undo, redo, canUndo, canRedo } = useTaskTreeContext();

  return (
    <div
      className="h-screen bg-notion-bg-subsidebar border-l border-notion-border flex flex-col"
      style={{ width }}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-[20px] font-semibold uppercase tracking-wider text-notion-text-secondary">
          Tasks
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1 rounded transition-colors ${canUndo ? "text-notion-text-secondary hover:text-notion-text" : "opacity-30 cursor-default"}`}
            title={t("taskTree.undo")}
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1 rounded transition-colors ${canRedo ? "text-notion-text-secondary hover:text-notion-text" : "opacity-30 cursor-default"}`}
            title={t("taskTree.redo")}
          >
            <Redo2 size={16} />
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-notion-text-secondary hover:text-notion-text rounded transition-colors"
          >
            <PanelRight size={18} />
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
