import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useTaskTreeContext } from "../../hooks/useTaskTreeContext";
import { TaskTreeNode } from "./TaskTreeNode";
import { TaskTreeInput } from "./TaskTreeInput";
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
  const { nodes, getChildren, addNode, moveNode, moveNodeInto, moveToRoot, promoteToFolder } =
    useTaskTreeContext();
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const rootChildren = getChildren(null);
  const inboxTasks = rootChildren.filter((n) => n.type === "task");
  const folders = rootChildren.filter((n) => n.type === "folder");

  const allTasks = nodes.filter((n) => n.type === "task");
  const completedTasks = allTasks.filter((t) => t.status === "DONE");
  const hasCompleted = completedTasks.length > 0;

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
      if (activeNode.type === "task") moveToRoot(active.id as string);
      return;
    }

    // Drop onto Projects section header
    if (overId === "droppable-projects-section") {
      if (activeNode.type === "subfolder") promoteToFolder(active.id as string);
      return;
    }

    // Normal node-to-node drop
    const overNode = nodes.find((n) => n.id === overId);
    if (!overNode) return;

    const isOverFolder = overNode.type === "folder" || overNode.type === "subfolder";
    const isDifferentParent = activeNode.parentId !== overNode.id;
    if (isOverFolder && isDifferentParent && activeNode.type !== "folder") {
      moveNodeInto(active.id as string, over.id as string);
    } else {
      moveNode(active.id as string, over.id as string);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeNode = activeId
    ? nodes.find((n) => n.id === activeId)
    : null;

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
                <span>
                  Inbox{" "}
                  {inboxTasks.length > 0 && (
                    <span className="font-normal">({inboxTasks.length})</span>
                  )}
                </span>
              </div>
              <SortableContext items={inboxIds} strategy={verticalListSortingStrategy}>
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
              <TaskTreeInput
                placeholder="New Task"
                onSubmit={(title) => addNode("task", null, title)}
              />
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
                  isOver ? "bg-notion-accent/10 ring-1 ring-notion-accent/30" : ""
                }`}
              >
                <FolderOpen size={14} />
                <span>Projects</span>
              </div>
              <SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">
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
              <TaskTreeInput
                placeholder="New Task"
                onSubmit={(title) => addNode("task", null, title)}
                allowFolderCreation={true}
                onSubmitFolder={(title) => addNode("folder", null, title)}
              />
            </div>
          )}
        </DroppableSection>

        <DragOverlay>
          {activeNode ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-notion-bg border border-notion-border shadow-lg text-sm text-notion-text">
              <GripVertical
                size={14}
                className="text-notion-text-secondary"
              />
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
            <span>Completed ({completedTasks.length})</span>
          </button>
          {showCompleted && (
            <div className="space-y-0.5 opacity-60">
              {completedTasks.map((task) => (
                <TaskTreeNode
                  key={task.id}
                  node={task}
                  depth={0}
                  onSelectTask={onSelectTask}
                  selectedTaskId={selectedTaskId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
