import { useState, useCallback } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { TaskNode } from '../types/taskTree';

interface UseTaskTreeDndParams {
  nodes: TaskNode[];
  moveNode: (activeId: string, overId: string) => void;
  moveNodeInto: (activeId: string, overId: string) => void;
  moveToRoot: (id: string) => void;
}

export function useTaskTreeDnd({ nodes, moveNode, moveNodeInto, moveToRoot }: UseTaskTreeDndParams) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeNode = nodes.find((n) => n.id === active.id);
    if (!activeNode) return;
    const overId = over.id as string;

    if (overId === 'droppable-inbox-section') {
      moveToRoot(active.id as string);
      return;
    }

    if (overId === 'droppable-projects-section') {
      if (activeNode.parentId !== null) moveToRoot(active.id as string);
      return;
    }

    const overNode = nodes.find((n) => n.id === overId);
    if (!overNode) return;

    const isOverFolder = overNode.type === 'folder';
    const isDifferentParent = activeNode.parentId !== overNode.id;
    if (isOverFolder && isDifferentParent) {
      moveNodeInto(active.id as string, over.id as string);
    } else {
      moveNode(active.id as string, over.id as string);
    }
  }, [nodes, moveNode, moveNodeInto, moveToRoot]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeNode = activeId ? nodes.find((n) => n.id === activeId) : null;

  return { sensors, activeId, activeNode, handleDragStart, handleDragEnd, handleDragCancel };
}
