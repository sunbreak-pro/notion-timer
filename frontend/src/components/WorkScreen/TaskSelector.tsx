import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Plus, Inbox, Folder, X } from "lucide-react";
import { useTaskTreeContext } from "../../hooks/useTaskTreeContext";
import { useTimerContext } from "../../hooks/useTimerContext";
import { useDebounce } from "../../hooks/useDebounce";
import type { TaskNode } from "../../types/taskTree";

interface TaskSelectorProps {
  currentTitle: string;
}

interface SectionItem {
  type: "header" | "task";
  node?: TaskNode;
  label: string;
  depth: number;
  folderId?: string;
  taskCount?: number;
}

export function TaskSelector({ currentTitle }: TaskSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTaskValue, setNewTaskValue] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { getChildren, addNode, updateNode } = useTaskTreeContext();
  const timer = useTimerContext();
  const debouncedSearch = useDebounce(newTaskValue, 150);

  // Inline editing state for Untitled tasks
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const editTitleRef = useRef<HTMLInputElement>(null);

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

  // Detect Untitled task and enter editing mode
  useEffect(() => {
    if (timer.activeTask?.title === 'Untitled') {
      setIsEditingTitle(true);
      setEditTitleValue('');
    }
  }, [timer.activeTask?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus the edit input when entering editing mode
  useEffect(() => {
    if (isEditingTitle && editTitleRef.current) {
      editTitleRef.current.focus();
    }
  }, [isEditingTitle]);

  const commitRename = () => {
    const trimmed = editTitleValue.trim();
    if (trimmed && timer.activeTask) {
      updateNode(timer.activeTask.id, { title: trimmed });
      timer.updateActiveTaskTitle(trimmed);
    }
    setIsEditingTitle(false);
  };

  // Parse "FolderName/taskName" input pattern (debounced for filtering)
  const parsedInput = useMemo(() => {
    const idx = debouncedSearch.indexOf('/');
    if (idx < 0) return { folderName: '', taskName: debouncedSearch, folder: null as TaskNode | null };
    const folderName = debouncedSearch.substring(0, idx).trim();
    const taskName = debouncedSearch.substring(idx + 1).trim();
    const rootChildren = getChildren(null);
    const folder = rootChildren.find(
      n => n.type === 'folder' && n.title.toLowerCase() === folderName.toLowerCase()
    ) ?? null;
    return { folderName, taskName, folder };
  }, [debouncedSearch, getChildren]);

  // Build hierarchical list of TODO tasks
  const items = useMemo(() => {
    const result: SectionItem[] = [];
    const rootChildren = getChildren(null);
    const filterText = debouncedSearch.trim().toLowerCase();

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

    // If a folder is matched via "FolderName/" input, show only that folder
    if (parsedInput.folder) {
      const folderTasks = collectTasks(parsedInput.folder.id);
      const searchText = parsedInput.taskName.toLowerCase();
      const filtered = searchText
        ? folderTasks.filter(t => t.title.toLowerCase().includes(searchText))
        : folderTasks;

      if (filtered.length > 0) {
        result.push({ type: "header", label: parsedInput.folder.title, depth: 0, folderId: parsedInput.folder.id, taskCount: filtered.length });
        filtered.forEach((t) =>
          result.push({ type: "task", node: t, label: t.title, depth: 1 })
        );
      }
      return result;
    }

    // Inbox tasks
    const inboxTasks = rootChildren.filter(
      (n) => n.type === "task" && n.status === "TODO"
    );
    const filteredInbox = filterText
      ? inboxTasks.filter(t => t.title.toLowerCase().includes(filterText))
      : inboxTasks;
    if (filteredInbox.length > 0) {
      result.push({ type: "header", label: "Inbox", depth: 0 });
      filteredInbox.forEach((t) =>
        result.push({ type: "task", node: t, label: t.title, depth: 1 })
      );
    }

    // Folders with their tasks
    const folders = rootChildren.filter((n) => n.type === "folder");
    folders.forEach((folder) => {
      const folderTasks = collectTasks(folder.id);
      const filtered = filterText
        ? folderTasks.filter(t => t.title.toLowerCase().includes(filterText))
        : folderTasks;
      if (filtered.length > 0) {
        result.push({ type: "header", label: folder.title, depth: 0, folderId: folder.id, taskCount: filtered.length });
        // Show tasks if expanded OR if user is searching
        if (expandedFolders.has(folder.id) || filterText) {
          filtered.forEach((t) =>
            result.push({ type: "task", node: t, label: t.title, depth: 1 })
          );
        }
      }
    });

    return result;
  }, [getChildren, parsedInput, debouncedSearch, expandedFolders]);

  const handleSelectTask = (task: TaskNode) => {
    timer.openForTask(task.id, task.title, task.workDurationMinutes);
    setNewTaskValue("");
    setIsOpen(false);
  };

  const handleCreateTask = () => {
    // Use live input (not debounced) for task creation
    const slashIdx = newTaskValue.indexOf('/');
    if (slashIdx >= 0) {
      const folderName = newTaskValue.substring(0, slashIdx).trim();
      const taskName = newTaskValue.substring(slashIdx + 1).trim();
      if (!taskName) return;
      const rootChildren = getChildren(null);
      const folder = rootChildren.find(
        n => n.type === 'folder' && n.title.toLowerCase() === folderName.toLowerCase()
      );
      if (folder) {
        const newNode = addNode("task", folder.id, taskName);
        if (!newNode) return;
        timer.openForTask(newNode.id, newNode.title);
      } else {
        const newNode = addNode("task", null, newTaskValue.trim());
        if (!newNode) return;
        timer.openForTask(newNode.id, newNode.title);
      }
    } else {
      const trimmed = newTaskValue.trim();
      if (!trimmed) return;
      const newNode = addNode("task", null, trimmed);
      if (!newNode) return;
      timer.openForTask(newNode.id, newNode.title);
    }
    setNewTaskValue("");
    setIsOpen(false);
  };

  const handleHeaderClick = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleClearTask = () => {
    timer.clearTask();
    setIsOpen(false);
  };

  const placeholder = parsedInput.folder
    ? `New task in ${parsedInput.folder.title}...`
    : "Create new task...";

  return (
    <div className="relative" ref={dropdownRef}>
      {isEditingTitle ? (
        <input
          ref={editTitleRef}
          type="text"
          value={editTitleValue}
          onChange={(e) => setEditTitleValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setIsEditingTitle(false);
          }}
          onBlur={commitRename}
          placeholder="Task name..."
          className="text-lg font-semibold text-notion-text bg-transparent outline-none border-b border-notion-accent max-w-full"
        />
      ) : (
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
      )}

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
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none text-sm text-notion-text placeholder:text-notion-text-secondary"
            />
          </div>

          {/* Task list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {items.map((item, idx) => {
              if (item.type === "header") {
                const isFolder = !!item.folderId;
                const isExpanded = item.folderId ? expandedFolders.has(item.folderId) : true;
                return (
                  <button
                    key={`header-${idx}`}
                    onClick={() => isFolder && item.folderId && handleHeaderClick(item.folderId)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-notion-text-secondary ${
                      isFolder ? 'hover:bg-notion-hover cursor-pointer' : ''
                    }`}
                  >
                    {item.label === "Inbox" ? (
                      <Inbox size={12} />
                    ) : (
                      <>
                        {isExpanded
                          ? <ChevronDown size={12} />
                          : <ChevronRight size={12} />
                        }
                        <Folder size={12} />
                      </>
                    )}
                    <span>{item.label}</span>
                    {isFolder && item.taskCount != null && (
                      <span className="ml-auto text-[10px] text-notion-text-secondary font-normal">
                        {item.taskCount}
                      </span>
                    )}
                  </button>
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
