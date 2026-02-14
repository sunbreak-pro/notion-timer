import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "../../hooks/useClickOutside";
import { ChevronRight } from "lucide-react";
import type { TaskNode } from "../../types/taskTree";

interface TaskCreatePopoverProps {
  position: { x: number; y: number };
  onSubmitTask: (title: string, parentId: string | null) => void;
  onSubmitNote?: (title: string) => void;
  folders?: TaskNode[];
  onClose: () => void;
}

export function TaskCreatePopover({
  position,
  onSubmitTask,
  onSubmitNote,
  folders,
  onClose,
}: TaskCreatePopoverProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"task" | "note">("task");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside(ref, onClose, true);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build folder tree for display
  const folderTree = useMemo(() => {
    if (!folders) return [];
    const roots = folders.filter(
      (f) => f.parentId === null || !folders.some((p) => p.id === f.parentId),
    );
    const getChildren = (parentId: string): TaskNode[] =>
      folders.filter((f) => f.parentId === parentId);

    const flatten = (
      nodes: TaskNode[],
      depth: number,
    ): { node: TaskNode; depth: number }[] => {
      const result: { node: TaskNode; depth: number }[] = [];
      for (const node of nodes) {
        result.push({ node, depth });
        result.push(...flatten(getChildren(node.id), depth + 1));
      }
      return result;
    };
    return flatten(roots, 0);
  }, [folders]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (title.trim()) {
        if (mode === "task") {
          onSubmitTask(title.trim(), selectedFolderId);
        } else {
          onSubmitNote?.(title.trim());
        }
      }
      onClose();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const left = Math.min(position.x, window.innerWidth - 260 - 16);
  const top = Math.min(position.y, window.innerHeight - 200 - 16);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-notion-bg border border-notion-border rounded-lg shadow-xl p-2"
      style={{ left, top, width: 260 }}
    >
      {/* Mode toggle */}
      {onSubmitNote && (
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setMode("task")}
            className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
              mode === "task"
                ? "bg-notion-accent/10 text-notion-accent"
                : "text-notion-text-secondary hover:bg-notion-hover"
            }`}
          >
            {t("calendar.task")}
          </button>
          <button
            onClick={() => setMode("note")}
            className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
              mode === "note"
                ? "bg-notion-accent/10 text-notion-accent"
                : "text-notion-text-secondary hover:bg-notion-hover"
            }`}
          >
            {t("calendar.note")}
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          mode === "task"
            ? t("calendar.taskNamePlaceholder")
            : t("calendar.noteNamePlaceholder")
        }
        className="w-full px-2 py-1.5 text-sm bg-transparent border border-notion-border rounded-md outline-none focus:border-notion-accent text-notion-text placeholder:text-notion-text-secondary"
      />

      {/* Folder selector (task mode only) */}
      {mode === "task" && folders && folders.length > 0 && (
        <div className="mt-2">
          <label className="text-[10px] text-notion-text-secondary uppercase tracking-wide mb-1 block">
            {t("calendar.selectFolder")}
          </label>
          <div className="max-h-32 overflow-y-auto border border-notion-border rounded-md">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full px-2 py-1 text-left text-xs transition-colors ${
                selectedFolderId === null
                  ? "bg-notion-accent/10 text-notion-accent"
                  : "text-notion-text hover:bg-notion-hover"
              }`}
            >
              Inbox
            </button>
            {folderTree.map(({ node, depth }) => (
              <button
                key={node.id}
                onClick={() => setSelectedFolderId(node.id)}
                className={`w-full px-2 py-1 text-left text-xs transition-colors flex items-center ${
                  selectedFolderId === node.id
                    ? "bg-notion-accent/10 text-notion-accent"
                    : "text-notion-text hover:bg-notion-hover"
                }`}
                style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
              >
                {depth > 0 && (
                  <ChevronRight
                    size={10}
                    className="mr-1 text-notion-text-secondary/50"
                  />
                )}
                {node.color && (
                  <span
                    className="w-2 h-2 rounded-full mr-1.5 shrink-0"
                    style={{ backgroundColor: node.color }}
                  />
                )}
                <span className="truncate">{node.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
