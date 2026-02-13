import { useState, useCallback } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import type { TaskNode } from '../types/taskTree';

export interface OverInfo {
  overId: string;
  position: 'above' | 'below' | 'inside';
}

interface UseTaskTreeDndParams {
  nodes: TaskNode[];
  moveNode: (activeId: string, overId: string, position?: 'above' | 'below') => void;
  moveNodeInto: (activeId: string, overId: string) => void;
  moveToRoot: (id: string) => void;
}

const getPointerY = (event: DragOverEvent | DragEndEvent): number | null => {
  if (!(event.activatorEvent instanceof PointerEvent)) return null;
  return event.activatorEvent.clientY + event.delta.y;
};

export function useTaskTreeDnd({ nodes, moveNode, moveNodeInto, moveToRoot }: UseTaskTreeDndParams) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overInfo, setOverInfo] = useState<OverInfo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverInfo(null);
      return;
    }

    const overId = over.id as string;
    const overNode = nodes.find((n) => n.id === overId);

    if (!overNode) {
      setOverInfo(null);
      return;
    }

    const pointerY = getPointerY(event);
    if (!pointerY || !over.rect) {
      setOverInfo({ overId, position: overNode.type === 'folder' ? 'inside' : 'below' });
      return;
    }

    if (overNode.type === 'folder') {
      // 3-zone: top 30% = above, middle 40% = inside, bottom 30% = below
      const { top, height } = over.rect;
      const ratio = (pointerY - top) / height;
      if (ratio < 0.3) {
        setOverInfo({ overId, position: 'above' });
      } else if (ratio > 0.7) {
        setOverInfo({ overId, position: 'below' });
      } else {
        setOverInfo({ overId, position: 'inside' });
      }
    } else {
      // 2-zone: top 50% = above, bottom 50% = below
      const { top, height } = over.rect;
      const relY = pointerY - top;
      setOverInfo({ overId, position: relY < height / 2 ? 'above' : 'below' });
    }
  }, [nodes]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    setOverInfo(null);
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

    if (overNode.type === 'folder') {
      const pointerY = getPointerY(event);
      if (!pointerY || !over.rect) {
        // Fallback: drop inside
        if (activeNode.parentId !== overNode.id) {
          moveNodeInto(active.id as string, over.id as string);
        }
        return;
      }

      const { top, height } = over.rect;
      const ratio = (pointerY - top) / height;

      if (ratio < 0.3) {
        moveNode(active.id as string, over.id as string, 'above');
      } else if (ratio > 0.7) {
        moveNode(active.id as string, over.id as string, 'below');
      } else {
        if (activeNode.parentId !== overNode.id) {
          moveNodeInto(active.id as string, over.id as string);
        }
      }
    } else {
      const pointerY = getPointerY(event);
      if (!pointerY || !over.rect) {
        moveNode(active.id as string, over.id as string, 'below');
        return;
      }
      const { top, height } = over.rect;
      const position = (pointerY - top) < height / 2 ? 'above' : 'below';
      moveNode(active.id as string, over.id as string, position);
    }
  }, [nodes, moveNode, moveNodeInto, moveToRoot]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverInfo(null);
  }, []);

  const activeNode = activeId ? nodes.find((n) => n.id === activeId) : null;

  return { sensors, activeId, activeNode, overInfo, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel };
}
