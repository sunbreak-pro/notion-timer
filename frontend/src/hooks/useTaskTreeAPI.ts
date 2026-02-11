import { useState, useCallback, useMemo, useEffect } from 'react';
import type { TaskNode, NodeType } from '../types/taskTree';
import { useTaskTreeCRUD } from './useTaskTreeCRUD';
import { useTaskTreeDeletion } from './useTaskTreeDeletion';
import { useTaskTreeMovement } from './useTaskTreeMovement';
import { resolveTaskColor } from '../utils/folderColor';
import { getFolderTag } from '../utils/folderTag';
import { getDataService } from '../services';

let idCounter = Date.now();
function generateId(type: NodeType): string {
  return `${type}-${++idCounter}`;
}

export function useTaskTreeAPI() {
  const [nodes, setNodes] = useState<TaskNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from DataService on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tree = await getDataService().fetchTaskTree();
        if (!cancelled) {
          setNodes(tree);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load tasks');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback((updated: TaskNode[]) => {
    setNodes(updated);
    getDataService().syncTaskTree(updated).catch((e) => console.warn('[TaskTree] sync:', e.message));
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

  const getTaskColor = useCallback((taskId: string) => resolveTaskColor(taskId, nodes), [nodes]);
  const getFolderTagForTask = useCallback((taskId: string) => getFolderTag(taskId, nodes), [nodes]);

  return {
    nodes: activeNodes,
    deletedNodes,
    getChildren,
    isLoading,
    error,
    getTaskColor,
    getFolderTagForTask,
    ...crud,
    ...deletion,
    ...movement,
  };
}
