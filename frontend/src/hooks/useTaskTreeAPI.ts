import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { TaskNode, NodeType } from '../types/taskTree';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useTaskTreeCRUD } from './useTaskTreeCRUD';
import { useTaskTreeDeletion } from './useTaskTreeDeletion';
import { useTaskTreeMovement } from './useTaskTreeMovement';
import { resolveTaskColor } from '../utils/folderColor';
import { getFolderTag } from '../utils/folderTag';
import * as api from '../api/taskClient';

const STORAGE_KEY = STORAGE_KEYS.TASK_TREE;

function loadLocalNodes(): TaskNode[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
}

function saveLocalNodes(nodes: TaskNode[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
}

let idCounter = Date.now();
function generateId(type: NodeType): string {
  return `${type}-${++idCounter}`;
}

export function useTaskTreeAPI() {
  const [nodes, setNodes] = useState<TaskNode[]>(loadLocalNodes);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const syncPending = useRef(false);

  // Load from API on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tree = await api.fetchTaskTree();
        if (!cancelled) {
          setIsBackendAvailable(true);
          // Only replace local state if backend has data or local is empty
          if (tree.length > 0 || loadLocalNodes().length === 0) {
            setNodes(tree);
            saveLocalNodes(tree);
          }
        }
      } catch (e) {
        // Backend unavailable, use localStorage
        if (!cancelled) {
          setIsBackendAvailable(false);
          setError(e instanceof Error ? e.message : 'Backend unavailable');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Sync to backend in background (debounced)
  const syncToBackend = useCallback((updated: TaskNode[]) => {
    if (!isBackendAvailable) return;
    if (syncPending.current) return;
    syncPending.current = true;
    setTimeout(() => {
      api.syncTaskTree(updated).catch(() => {
        // Silently fail - localStorage is the write-through cache
      }).finally(() => {
        syncPending.current = false;
      });
    }, 500);
  }, [isBackendAvailable]);

  const persist = useCallback((updated: TaskNode[]) => {
    setNodes(updated);
    saveLocalNodes(updated);
    syncToBackend(updated);
  }, [syncToBackend]);

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
    isBackendAvailable,
    getTaskColor,
    getFolderTagForTask,
    ...crud,
    ...deletion,
    ...movement,
  };
}
