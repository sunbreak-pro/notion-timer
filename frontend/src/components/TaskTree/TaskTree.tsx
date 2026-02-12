import { useState, useMemo } from "react";
import {
  DndContext,
  pointerWithin,
  DragOverlay,
  useDroppable,
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

import { useTaskTreeDnd } from "../../hooks/useTaskTreeDnd";
import { useTaskTreeKeyboard } from "../../hooks/useTaskTreeKeyboard";
import { TaskTreeNode } from "./TaskTreeNode";
import { InlineCreateInput } from "./InlineCreateInput";

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

  const [showCompleted, setShowCompleted] = useState(false);
  const [isCreatingInboxTask, setIsCreatingInboxTask] = useState(false);
  const [isCreatingProjectFolder, setIsCreatingProjectFolder] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const { sensors, activeNode, handleDragStart, handleDragEnd, handleDragCancel } =
    useTaskTreeDnd({ nodes, moveNode, moveNodeInto, moveToRoot });

  const rootChildren = useMemo(() => getChildren(null), [getChildren]);
  const inboxTasks = useMemo(
    () => rootChildren.filter((n) => n.type === "task" && n.status !== "DONE"),
    [rootChildren],
  );
  const folders = useMemo(
    () => rootChildren.filter((n) => n.type === "folder" && n.status !== "DONE"),
    [rootChildren],
  );
  const completedRootTasks = useMemo(
    () => rootChildren.filter((n) => n.type === "task" && n.status === "DONE"),
    [rootChildren],
  );
  const completedFolders = useMemo(
    () => rootChildren.filter((n) => n.type === "folder" && n.status === "DONE"),
    [rootChildren],
  );
  const hasCompleted = completedRootTasks.length > 0 || completedFolders.length > 0;

  const inboxIds = useMemo(() => inboxTasks.map((n) => n.id), [inboxTasks]);
  const folderIds = useMemo(() => folders.map((n) => n.id), [folders]);

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

  useTaskTreeKeyboard({
    selectedTaskId: selectedTaskId ?? null,
    visibleNodes,
    nodes,
    onSelectTask,
    toggleExpanded,
    toggleTaskStatus,
    moveNodeInto,
    moveToRoot,
  });

  return (
    <div className="space-y-1">
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
                  isOver ? "bg-notion-accent/10 ring-1 ring-notion-accent/30" : ""
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
                    onClick={(e) => { e.stopPropagation(); setIsCreatingInboxTask(true); }}
                    className="hover:text-notion-text transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <SortableContext items={inboxIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">
                  {inboxTasks.map((node) => (
                    <TaskTreeNode key={node.id} node={node} depth={0} onPlayTask={onPlayTask} onSelectTask={onSelectTask} selectedTaskId={selectedTaskId} />
                  ))}
                </div>
              </SortableContext>
              {isCreatingInboxTask && (
                <InlineCreateInput placeholder="New task..." onSubmit={(title) => addNode("task", null, title)} onCancel={() => setIsCreatingInboxTask(false)} />
              )}
            </div>
          )}
        </DroppableSection>

        <div className="border-t border-notion-border my-1" />

        {/* Projects Section */}
        <DroppableSection id="droppable-projects-section">
          {(isOver) => (
            <div>
              <div
                className={`flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-notion-text-secondary rounded-md transition-colors ${
                  isOver ? "bg-notion-accent/10 ring-1 ring-notion-accent/30" : ""
                }`}
              >
                <FolderOpen size={14} />
                <div className="flex-row flex items-center justify-between w-full">
                  Projects
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsTemplateDialogOpen(true); }}
                      className="hover:text-notion-text transition-colors"
                      title="From template"
                    >
                      <FileDown size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsCreatingProjectFolder(true); }}
                      className="hover:text-notion-text transition-colors"
                    >
                      <LucideFolderPlus size={14} />
                    </button>
                  </div>
                </div>
              </div>
              <SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {folders.map((node) => (
                    <TaskTreeNode key={node.id} node={node} depth={0} onPlayTask={onPlayTask} onSelectTask={onSelectTask} selectedTaskId={selectedTaskId} />
                  ))}
                </div>
              </SortableContext>
              {isCreatingProjectFolder && (
                <InlineCreateInput placeholder="New folder..." onSubmit={(title) => addNode("folder", null, title)} onCancel={() => setIsCreatingProjectFolder(false)} />
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
            {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <CheckCircle2 size={14} />
            <span>Completed ({completedRootTasks.length + completedFolders.length})</span>
          </button>
          {showCompleted && (
            <div className="space-y-0.5 opacity-60">
              {completedRootTasks.map((task) => (
                <TaskTreeNode key={task.id} node={task} depth={0} onSelectTask={onSelectTask} selectedTaskId={selectedTaskId} />
              ))}
              {completedFolders.map((folder) => (
                <TaskTreeNode key={folder.id} node={folder} depth={0} onSelectTask={onSelectTask} selectedTaskId={selectedTaskId} />
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
