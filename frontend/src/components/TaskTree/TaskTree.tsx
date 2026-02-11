import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Inbox,
  FolderOpen,
  CheckCircle2,
  Plus,
  LucideFolderPlus,
  FileDown,
} from "lucide-react";
import { useTaskTreeContext } from "../../hooks/useTaskTreeContext";
import { useTagContext } from "../../hooks/useTagContext";
import { TaskTreeNode } from "./TaskTreeNode";
import { InlineCreateInput } from "./InlineCreateInput";
import { TagFilter } from "../Tags/TagFilter";
import { TemplateDialog } from "../Templates/TemplateDialog";
import type { TaskNode } from "../../types/taskTree";

interface TaskTreeProps {
  onPlayTask?: (node: TaskNode) => void;
  onSelectTask?: (id: string) => void;
  selectedTaskId?: string | null;
}

function DroppableSection({
  id,
  children,
}: {
  id: string;
  children: (isOver: boolean) => React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef}>{children(isOver)}</div>;
}

export function TaskTree({
  onPlayTask,
  onSelectTask,
  selectedTaskId,
}: TaskTreeProps) {
  const {
    nodes,
    getChildren,
    addNode,
    moveNode,
    moveNodeInto,
    moveToRoot,
    toggleExpanded,
    toggleTaskStatus,
  } = useTaskTreeContext();
  const { hasTagFilter, taskPassesFilter } = useTagContext();
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreatingInboxTask, setIsCreatingInboxTask] = useState(false);
  const [isCreatingProjectFolder, setIsCreatingProjectFolder] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const rootChildren = useMemo(() => getChildren(null), [getChildren]);
  const inboxTasks = useMemo(
    () => rootChildren.filter((n) => n.type === "task" && n.status !== "DONE" && (!hasTagFilter || taskPassesFilter(n.id))),
    [rootChildren, hasTagFilter, taskPassesFilter],
  );
  const folders = useMemo(
    () =>
      rootChildren.filter(
        (n) => n.type === "folder" && n.status !== "DONE",
      ),
    [rootChildren],
  );

  const completedRootTasks = useMemo(
    () => rootChildren.filter((n) => n.type === "task" && n.status === "DONE"),
    [rootChildren],
  );
  const completedFolders = useMemo(
    () =>
      rootChildren.filter(
        (n) => n.type === "folder" && n.status === "DONE",
      ),
    [rootChildren],
  );
  const hasCompleted =
    completedRootTasks.length > 0 || completedFolders.length > 0;

  const inboxIds = useMemo(() => inboxTasks.map((n) => n.id), [inboxTasks]);
  const folderIds = useMemo(() => folders.map((n) => n.id), [folders]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeNode = nodes.find((n) => n.id === active.id);
    if (!activeNode) return;
    const overId = over.id as string;

    // Drop onto Inbox section header
    if (overId === "droppable-inbox-section") {
      moveToRoot(active.id as string);
      return;
    }

    // Drop onto Projects section header
    if (overId === "droppable-projects-section") {
      if (activeNode.parentId !== null) moveToRoot(active.id as string);
      return;
    }

    // Normal node-to-node drop
    const overNode = nodes.find((n) => n.id === overId);
    if (!overNode) return;

    const isOverFolder = overNode.type === "folder";
    const isDifferentParent = activeNode.parentId !== overNode.id;
    if (isOverFolder && isDifferentParent) {
      moveNodeInto(active.id as string, over.id as string);
    } else {
      moveNode(active.id as string, over.id as string);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeNode = activeId ? nodes.find((n) => n.id === activeId) : null;

  // Compute flat visible list for keyboard navigation
  const visibleNodes = useMemo(() => {
    const result: TaskNode[] = [];
    const addVisible = (list: TaskNode[]) => {
      for (const node of list) {
        result.push(node);
        if (node.type === "folder" && node.isExpanded) {
          addVisible(getChildren(node.id));
        }
      }
    };
    addVisible(inboxTasks);
    addVisible(folders);
    return result;
  }, [inboxTasks, folders, getChildren]);

  // Indent: move selected node into the previous sibling folder
  const indentNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const siblings = nodes
        .filter((n) => !n.isDeleted && n.parentId === node.parentId)
        .sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex((n) => n.id === nodeId);
      // Find the closest previous sibling that is a folder
      for (let i = idx - 1; i >= 0; i--) {
        if (siblings[i].type === "folder") {
          moveNodeInto(nodeId, siblings[i].id);
          return;
        }
      }
    },
    [nodes, moveNodeInto],
  );

  // Outdent: move selected node to grandparent
  const outdentNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || !node.parentId) return;
      const parent = nodes.find((n) => n.id === node.parentId);
      if (!parent) return;
      if (parent.parentId === null) {
        moveToRoot(nodeId);
      } else {
        moveNodeInto(nodeId, parent.parentId);
      }
    },
    [nodes, moveNodeInto, moveToRoot],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (document.activeElement?.getAttribute("contenteditable") === "true")
        return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!selectedTaskId || visibleNodes.length === 0) {
          if (visibleNodes.length > 0) onSelectTask?.(visibleNodes[0].id);
          return;
        }
        const idx = visibleNodes.findIndex((n) => n.id === selectedTaskId);
        if (idx < visibleNodes.length - 1) {
          onSelectTask?.(visibleNodes[idx + 1].id);
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!selectedTaskId || visibleNodes.length === 0) {
          if (visibleNodes.length > 0)
            onSelectTask?.(visibleNodes[visibleNodes.length - 1].id);
          return;
        }
        const idx = visibleNodes.findIndex((n) => n.id === selectedTaskId);
        if (idx > 0) {
          onSelectTask?.(visibleNodes[idx - 1].id);
        }
        return;
      }

      if (!selectedTaskId) return;
      const selected = nodes.find((n) => n.id === selectedTaskId);
      if (!selected) return;

      // → expand folder, ← collapse folder
      if (
        e.key === "ArrowRight" &&
        selected.type === "folder" &&
        !selected.isExpanded
      ) {
        e.preventDefault();
        toggleExpanded(selected.id);
        return;
      }
      if (
        e.key === "ArrowLeft" &&
        selected.type === "folder" &&
        selected.isExpanded
      ) {
        e.preventDefault();
        toggleExpanded(selected.id);
        return;
      }

      // Cmd/Ctrl+Enter → toggle task status
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && selected.type === "task") {
        e.preventDefault();
        toggleTaskStatus(selected.id);
        return;
      }

      // Tab → indent, Shift+Tab → outdent
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          outdentNode(selected.id);
        } else {
          indentNode(selected.id);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedTaskId,
    visibleNodes,
    nodes,
    onSelectTask,
    toggleExpanded,
    toggleTaskStatus,
    indentNode,
    outdentNode,
  ]);

  return (
    <div className="space-y-1">
      <TagFilter />
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Inbox Section */}
        <DroppableSection id="droppable-inbox-section">
          {(isOver) => (
            <div>
              <div
                className={`flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-notion-text-secondary rounded-md transition-colors ${
                  isOver
                    ? "bg-notion-accent/10 ring-1 ring-notion-accent/30"
                    : ""
                }`}
              >
                <Inbox size={14} />
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    Inbox{" "}
                    {inboxTasks.length > 0 && (
                      <div className="font-normal">({inboxTasks.length})</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreatingInboxTask(true);
                    }}
                    className="hover:text-notion-text transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <SortableContext
                items={inboxIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0.5">
                  {inboxTasks.map((node) => (
                    <TaskTreeNode
                      key={node.id}
                      node={node}
                      depth={0}
                      onPlayTask={onPlayTask}
                      onSelectTask={onSelectTask}
                      selectedTaskId={selectedTaskId}
                    />
                  ))}
                </div>
              </SortableContext>
              {isCreatingInboxTask && (
                <InlineCreateInput
                  placeholder="New task..."
                  onSubmit={(title) => addNode("task", null, title)}
                  onCancel={() => setIsCreatingInboxTask(false)}
                />
              )}
            </div>
          )}
        </DroppableSection>

        {/* Divider */}
        <div className="border-t border-notion-border my-1" />

        {/* Projects Section */}
        <DroppableSection id="droppable-projects-section">
          {(isOver) => (
            <div>
              <div
                className={`flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-notion-text-secondary rounded-md transition-colors ${
                  isOver
                    ? "bg-notion-accent/10 ring-1 ring-notion-accent/30"
                    : ""
                }`}
              >
                <FolderOpen size={14} />
                <div
                  className={
                    "flex-row flex items-center justify-between w-full"
                  }
                >
                  Projects
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTemplateDialogOpen(true);
                      }}
                      className="hover:text-notion-text transition-colors"
                      title="From template"
                    >
                      <FileDown size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCreatingProjectFolder(true);
                      }}
                      className="hover:text-notion-text transition-colors"
                    >
                      <LucideFolderPlus size={14} />
                    </button>
                  </div>
                </div>
              </div>
              <SortableContext
                items={folderIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {folders.map((node) => (
                    <TaskTreeNode
                      key={node.id}
                      node={node}
                      depth={0}
                      onPlayTask={onPlayTask}
                      onSelectTask={onSelectTask}
                      selectedTaskId={selectedTaskId}
                    />
                  ))}
                </div>
              </SortableContext>
              {isCreatingProjectFolder && (
                <InlineCreateInput
                  placeholder="New folder..."
                  onSubmit={(title) => addNode("folder", null, title)}
                  onCancel={() => setIsCreatingProjectFolder(false)}
                />
              )}
            </div>
          )}
        </DroppableSection>

        <DragOverlay>
          {activeNode ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-notion-bg border border-notion-border shadow-lg text-sm text-notion-text">
              <GripVertical size={14} className="text-notion-text-secondary" />
              <span>{activeNode.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {hasCompleted && (
        <div className="pt-2 border-t border-notion-border">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-xs text-notion-text-secondary hover:text-notion-text mb-1 px-2"
          >
            {showCompleted ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
            <CheckCircle2 size={14} />
            <span>
              Completed ({completedRootTasks.length + completedFolders.length})
            </span>
          </button>
          {showCompleted && (
            <div className="space-y-0.5 opacity-60">
              {completedRootTasks.map((task) => (
                <TaskTreeNode
                  key={task.id}
                  node={task}
                  depth={0}
                  onSelectTask={onSelectTask}
                  selectedTaskId={selectedTaskId}
                />
              ))}
              {completedFolders.map((folder) => (
                <TaskTreeNode
                  key={folder.id}
                  node={folder}
                  depth={0}
                  onSelectTask={onSelectTask}
                  selectedTaskId={selectedTaskId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {isTemplateDialogOpen && (
        <TemplateDialog onClose={() => setIsTemplateDialogOpen(false)} />
      )}
    </div>
  );
}
