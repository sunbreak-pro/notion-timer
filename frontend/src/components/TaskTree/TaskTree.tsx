import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTaskTreeContext } from "../../hooks/useTaskTreeContext";
import { TaskTreeNode } from "./TaskTreeNode";
import { TaskTreeInput } from "./TaskTreeInput";
import type { TaskNode } from "../../types/taskTree";

interface TaskTreeProps {
  onPlayTask?: (node: TaskNode) => void;
  selectedFolderId?: string | null;
  onSelectTask?: (id: string) => void;
  selectedTaskId?: string | null;
}

export function TaskTree({
  onPlayTask,
  selectedFolderId,
  onSelectTask,
  selectedTaskId,
}: TaskTreeProps) {
  const { nodes, getChildren, addNode, moveNode } = useTaskTreeContext();
  const [showCompleted, setShowCompleted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const isInbox = selectedFolderId === null || selectedFolderId === undefined;

  const displayNodes = isInbox
    ? getChildren(null).filter((n) => n.type !== "folder")
    : getChildren(selectedFolderId!);

  const allTasks = nodes.filter((n) => n.type === "task");
  const completedTasks = allTasks.filter((t) => t.status === "DONE");
  const hasCompleted = completedTasks.length > 0;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    moveNode(active.id as string, over.id as string);
  };

  const allNodeIds = nodes.map((n) => n.id);

  return (
    <div className="space-y-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={allNodeIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
            {displayNodes.map((node) => (
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
      </DndContext>

      {isInbox ? (
        <TaskTreeInput
          placeholder="New Task"
          onSubmit={(title) => addNode("task", null, title)}
        />
      ) : (
        <TaskTreeInput
          placeholder="New Task"
          onSubmit={(title) => addNode("task", selectedFolderId!, title)}
        />
      )}

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
