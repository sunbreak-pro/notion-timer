import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Plus, Inbox, Folder, X } from "lucide-react";
import { useTaskTreeContext } from "../../hooks/useTaskTreeContext";
import { useTimerContext } from "../../hooks/useTimerContext";
import type { TaskNode } from "../../types/taskTree";

interface TaskSelectorProps {
  currentTitle: string;
}

interface SectionItem {
  type: "header" | "task";
  node?: TaskNode;
  label: string;
  depth: number;
}

export function TaskSelector({ currentTitle }: TaskSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTaskValue, setNewTaskValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { getChildren, addNode } = useTaskTreeContext();
  const timer = useTimerContext();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Build hierarchical list of TODO tasks
  const items = useMemo(() => {
    const result: SectionItem[] = [];

    // Inbox tasks
    const rootChildren = getChildren(null);
    const inboxTasks = rootChildren.filter(
      (n) => n.type === "task" && n.status === "TODO"
    );
    if (inboxTasks.length > 0) {
      result.push({ type: "header", label: "Inbox", depth: 0 });
      inboxTasks.forEach((t) =>
        result.push({ type: "task", node: t, label: t.title, depth: 1 })
      );
    }

    // Folders with their tasks
    const folders = rootChildren.filter((n) => n.type === "folder");
    folders.forEach((folder) => {
      const collectTasks = (parentId: string): TaskNode[] => {
        const children = getChildren(parentId);
        const tasks: TaskNode[] = [];
        children.forEach((child) => {
          if (child.type === "task" && child.status === "TODO") {
            tasks.push(child);
          } else if (child.type === "folder") {
            tasks.push(...collectTasks(child.id));
          }
        });
        return tasks;
      };

      const folderTasks = collectTasks(folder.id);
      if (folderTasks.length > 0) {
        result.push({ type: "header", label: folder.title, depth: 0 });
        folderTasks.forEach((t) =>
          result.push({ type: "task", node: t, label: t.title, depth: 1 })
        );
      }
    });

    return result;
  }, [getChildren]);

  const handleSelectTask = (task: TaskNode) => {
    timer.openForTask(task.id, task.title, task.workDurationMinutes);
    setIsOpen(false);
  };

  const handleCreateTask = () => {
    const trimmed = newTaskValue.trim();
    if (!trimmed) return;
    const newNode = addNode("task", null, trimmed);
    if (!newNode) return;
    timer.openForTask(newNode.id, newNode.title);
    setNewTaskValue("");
    setIsOpen(false);
  };

  const handleClearTask = () => {
    timer.clearTask();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-lg font-semibold text-notion-text hover:text-notion-accent transition-colors max-w-full"
      >
        <span className="truncate">{currentTitle}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-notion-bg border border-notion-border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* New task input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-notion-border">
            <Plus size={14} className="text-notion-text-secondary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={newTaskValue}
              onChange={(e) => setNewTaskValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateTask();
                if (e.key === "Escape") setIsOpen(false);
              }}
              placeholder="Create new task..."
              className="flex-1 bg-transparent outline-none text-sm text-notion-text placeholder:text-notion-text-secondary"
            />
          </div>

          {/* Task list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {items.map((item, idx) => {
              if (item.type === "header") {
                return (
                  <div
                    key={`header-${idx}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-notion-text-secondary"
                  >
                    {item.label === "Inbox" ? (
                      <Inbox size={12} />
                    ) : (
                      <Folder size={12} />
                    )}
                    <span>{item.label}</span>
                  </div>
                );
              }

              const isActive = timer.activeTask?.id === item.node?.id;
              return (
                <button
                  key={item.node!.id}
                  onClick={() => handleSelectTask(item.node!)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-notion-hover transition-colors truncate ${
                    isActive
                      ? "text-notion-accent bg-notion-accent/5 font-medium"
                      : "text-notion-text"
                  }`}
                  style={{ paddingLeft: `${item.depth * 12 + 12}px` }}
                >
                  {item.label}
                </button>
              );
            })}

            {items.length === 0 && (
              <div className="px-3 py-4 text-sm text-notion-text-secondary text-center">
                No tasks available
              </div>
            )}
          </div>

          {/* Free session option */}
          {timer.activeTask && (
            <div className="border-t border-notion-border">
              <button
                onClick={handleClearTask}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-notion-text-secondary hover:bg-notion-hover transition-colors"
              >
                <X size={14} />
                <span>Free Session</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
