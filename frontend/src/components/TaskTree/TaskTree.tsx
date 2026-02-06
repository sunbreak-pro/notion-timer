import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTaskTreeContext } from '../../hooks/useTaskTreeContext';
import { TaskTreeNode } from './TaskTreeNode';
import { TaskTreeInput } from './TaskTreeInput';
import type { TaskNode } from '../../types/taskTree';

interface TaskTreeProps {
  onPlayTask?: (node: TaskNode) => void;
}

export function TaskTree({ onPlayTask }: TaskTreeProps) {
  const { nodes, getChildren, addNode, moveNode } = useTaskTreeContext();
  const [showCompleted, setShowCompleted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const rootFolders = getChildren(null);

  const allTasks = nodes.filter(n => n.type === 'task');
  const completedTasks = allTasks.filter(t => t.status === 'DONE');
  const hasCompleted = completedTasks.length > 0;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    moveNode(active.id as string, over.id as string);
  };

  const allNodeIds = nodes.map(n => n.id);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-notion-text">Tasks</h2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allNodeIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-0.5">
            {rootFolders.map(folder => (
              <TaskTreeNode
                key={folder.id}
                node={folder}
                depth={0}
                onPlayTask={onPlayTask}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <TaskTreeInput
        placeholder="+ New Folder"
        onSubmit={(title) => addNode('folder', null, title)}
      />

      {hasCompleted && (
        <div className="pt-4 border-t border-notion-border">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-notion-text-secondary hover:text-notion-text mb-2"
          >
            {showCompleted ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Completed ({completedTasks.length})</span>
          </button>
          {showCompleted && (
            <div className="space-y-0.5 opacity-60">
              {completedTasks.map(task => (
                <TaskTreeNode
                  key={task.id}
                  node={task}
                  depth={1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
