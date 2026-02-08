import { useState, useCallback, useMemo } from 'react';
import type { TaskNode, NodeType } from '../types/taskTree';
import { mockTaskTree } from '../mocks/taskTree';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useTaskTreeCRUD } from './useTaskTreeCRUD';
import { useTaskTreeDeletion } from './useTaskTreeDeletion';
import { useTaskTreeMovement } from './useTaskTreeMovement';

const STORAGE_KEY = STORAGE_KEYS.TASK_TREE;

function loadNodes(): TaskNode[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed: TaskNode[] = JSON.parse(saved);
      // One-time migration: subfolder → folder
      let migrated = false;
      const result = parsed.map(n => {
        if ((n.type as string) === 'subfolder') {
          migrated = true;
          return { ...n, type: 'folder' as const };
        }
        return n;
      });
      if (migrated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      }
      return result;
    } catch {
      return mockTaskTree;
    }
  }
  return mockTaskTree;
}

function saveNodes(nodes: TaskNode[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
}

let idCounter = Date.now();
function generateId(type: NodeType): string {
  return `${type}-${++idCounter}`;
}

export function useTaskTree() {
  const [nodes, setNodes] = useState<TaskNode[]>(loadNodes);

  const persist = useCallback((updated: TaskNode[]) => {
    setNodes(updated);
    saveNodes(updated);
  }, []);

  const activeNodes = useMemo(() => nodes.filter(n => !n.isDeleted), [nodes]);
  const deletedNodes = useMemo(() => nodes.filter(n => n.isDeleted), [nodes]);

  const getChildren = useCallback((parentId: string | null) => {
    return activeNodes
      .filter(n => n.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }, [activeNodes]);

  const getNodeDepth = useCallback((nodeId: string): number => {
    let depth = 0;
    let current = nodes.find(n => n.id === nodeId);
    while (current?.parentId) {
      depth++;
      current = nodes.find(n => n.id === current!.parentId);
    }
    return depth;
  }, [nodes]);

  const crud = useTaskTreeCRUD(nodes, persist, getNodeDepth, generateId);
  const deletion = useTaskTreeDeletion(nodes, persist);
  const movement = useTaskTreeMovement(nodes, persist, getNodeDepth);

  return {
    nodes: activeNodes,
    deletedNodes,
    getChildren,
    ...crud,
    ...deletion,
    ...movement,
  };
}
