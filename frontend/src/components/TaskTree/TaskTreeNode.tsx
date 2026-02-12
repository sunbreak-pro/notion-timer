import { useState, useCallback, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { TaskNode } from "../../types/taskTree";
import { useTaskTreeContext } from "../../hooks/useTaskTreeContext";
import { useTimerContext } from "../../hooks/useTimerContext";

import { TaskNodeIndent } from "./TaskNodeIndent";
import { TaskNodeCheckbox } from "./TaskNodeCheckbox";
import { TaskNodeEditor } from "./TaskNodeEditor";
import { TaskNodeContent } from "./TaskNodeContent";
import { TaskNodeActions } from "./TaskNodeActions";
import { TaskNodeTimer, TaskNodeTimerBar } from "./TaskNodeTimer";
import { TaskNodeContextMenu } from "./TaskNodeContextMenu";

import { useTemplates } from "../../hooks/useTemplates";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { computeFolderProgress } from "../../utils/folderProgress";
import { fireTaskCompleteConfetti } from "../../utils/confetti";

interface TaskTreeNodeProps {
  node: TaskNode;
  depth: number;
  isLastChild?: boolean;
  onPlayTask?: (node: TaskNode) => void;
  onSelectTask?: (id: string) => void;
  selectedTaskId?: string | null;
}

export function TaskTreeNode({
  node,
  depth,
  isLastChild,
  onPlayTask,
  onSelectTask,
  selectedTaskId,
}: TaskTreeNodeProps) {
  const {
    nodes,
    getChildren,
    updateNode,
    toggleExpanded,
    toggleTaskStatus,
    softDelete,
    addNode,
    moveToRoot,
    completeFolderWithChildren,
    uncompleteFolder,
  } = useTaskTreeContext();

  const timer = useTimerContext();

  const { createTemplate } = useTemplates();

  const [isEditing, setIsEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: node.id });

  const children = getChildren(node.id);
  const childIds = useMemo(() => children.map((c) => c.id), [children]);
  const isFolder = node.type === "folder";
  const isDone = node.type === "task" && node.status === "DONE";
  const isFolderDone = isFolder && node.status === "DONE";
  const isTimerActive = timer.activeTask?.id === node.id && timer.isRunning;
  const isSelected = node.type === "task" && selectedTaskId === node.id;

  const progress = useMemo(
    () => isFolder ? computeFolderProgress(node.id, nodes) : undefined,
    [isFolder, node.id, nodes],
  );


  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...(isFolder && node.color && !isSelected
      ? { backgroundColor: `${node.color}30` }
      : {}),
  };

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleSaveAsTemplate = useCallback(() => {
    // Collect folder + all descendants
    const collected: TaskNode[] = [];
    const collect = (parentId: string) => {
      const kids = getChildren(parentId);
      for (const child of kids) {
        collected.push(child);
        if (child.type === 'folder') collect(child.id);
      }
    };
    collected.push(node);
    collect(node.id);
    createTemplate(node.title, JSON.stringify(collected));
  }, [node, getChildren, createTemplate]);

  const handleCompleteFolder = useCallback(() => {
    if (isFolderDone) {
      uncompleteFolder(node.id);
    } else {
      setShowConfirmDialog(true);
    }
  }, [isFolderDone, node.id, uncompleteFolder]);

  const handleConfirmComplete = useCallback(() => {
    completeFolderWithChildren(node.id);
    setShowConfirmDialog(false);
  }, [completeFolderWithChildren, node.id]);

  const handleToggleStatus = useCallback(() => {
    if (node.status !== 'DONE') {
      fireTaskCompleteConfetti();
    }
    toggleTaskStatus(node.id);
  }, [node.id, node.status, toggleTaskStatus]);

  return (
    <div>
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-center gap-0.5 rounded-md hover:bg-notion-hover transition-colors border-l-2 ${isSelected ? "bg-notion-hover border-l-notion-accent" : "border-l-transparent"} ${isFolder && isOver && !isDragging ? "ring-2 ring-notion-accent/50" : ""}`}
        onContextMenu={handleContextMenu}
        {...attributes}
      >
        <button
          {...listeners}
          className="opacity-0 group-hover:opacity-100 p-0.5 cursor-grab text-notion-text-secondary"
        >
          <GripVertical size={18} />
        </button>

        <TaskNodeIndent depth={depth} isLastChild={isLastChild} />

        <TaskNodeCheckbox
          isFolder={isFolder}
          isDone={isDone}
          isExpanded={node.isExpanded}
          color={node.color}
          onToggleExpand={() => toggleExpanded(node.id)}
          onToggleStatus={handleToggleStatus}
        />

        {isEditing ? (
          <TaskNodeEditor
            initialValue={node.title}
            onSave={(value) => {
              updateNode(node.id, { title: value });
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <TaskNodeContent
            title={node.title}
            isDone={isDone || isFolderDone}
            isFolder={isFolder}
            progress={progress}
            onSelectTask={onSelectTask}
            onStartEditing={() => setIsEditing(true)}
            onToggleExpand={() => toggleExpanded(node.id)}
            nodeId={node.id}
          />
        )}


        <TaskNodeTimer
          isActive={isTimerActive}
          remainingSeconds={timer.remainingSeconds}
          formatTime={timer.formatTime}
        />

        <TaskNodeActions
          node={node}
          isDone={isDone}
          isTimerActive={isTimerActive}
          isFolderDone={isFolderDone}
          makeFolder={(node) => addNode("folder", node.id, "New Folder")}
          makeTask={(node) => addNode("task", node.id, "New Task")}
          onPlayTask={onPlayTask}
          onDelete={softDelete}
          onCompleteFolder={isFolder ? handleCompleteFolder : undefined}
        />
      </div>

      {contextMenu && (
        <TaskNodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isFolder={isFolder}
          isDone={isDone}
          isFolderDone={isFolderDone}
          hasParent={node.parentId !== null}
          onRename={() => setIsEditing(true)}
          onAddTask={() => addNode("task", node.id, "New Task")}
          onAddFolder={() => addNode("folder", node.id, "New Folder")}
          onStartTimer={() => onPlayTask?.(node)}
          onMoveToRoot={() => moveToRoot(node.id)}
          onSaveAsTemplate={isFolder ? handleSaveAsTemplate : undefined}
          onCompleteFolder={isFolder ? handleCompleteFolder : undefined}
          onDelete={() => softDelete(node.id)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {showConfirmDialog && (
        <ConfirmDialog
          message="フォルダ内の未完了タスクもすべて完了になります。よろしいですか？"
          onConfirm={handleConfirmComplete}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}

      <TaskNodeTimerBar
        isActive={isTimerActive}
        progress={timer.progress}
        depth={depth}
      />

      {isFolder && node.isExpanded && (
        <SortableContext
          items={childIds}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {children.map((child, index) => (
              <TaskTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                isLastChild={index === children.length - 1}
                onPlayTask={onPlayTask}
                onSelectTask={onSelectTask}
                selectedTaskId={selectedTaskId}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
