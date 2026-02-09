import { useCallback } from 'react';
import type { TaskNode, NodeType, TaskStatus } from '../types/taskTree';
import { MAX_FOLDER_DEPTH } from '../types/taskTree';
import { getColorByIndex } from '../constants/folderColors';

interface AddNodeOptions {
  scheduledAt?: string;
}

export function useTaskTreeCRUD(
  nodes: TaskNode[],
  persist: (updated: TaskNode[]) => void,
  getNodeDepth: (nodeId: string) => number,
  generateId: (type: NodeType) => string,
) {
  const addNode = useCallback((type: NodeType, parentId: string | null, title: string, options?: AddNodeOptions) => {
    if (type === 'folder' && parentId !== null) {
      const parentDepth = getNodeDepth(parentId);
      if (parentDepth + 1 >= MAX_FOLDER_DEPTH) return null;
    }

    const siblings = nodes.filter(n => !n.isDeleted && n.parentId === parentId);
    const folderColor = type === 'folder'
      ? getColorByIndex(nodes.filter(n => n.type === 'folder' && !n.isDeleted).length)
      : undefined;

    const newNode: TaskNode = {
      id: generateId(type),
      type,
      title,
      parentId,
      order: siblings.length,
      status: type === 'task' ? 'TODO' : undefined,
      isExpanded: type !== 'task' ? true : undefined,
      createdAt: new Date().toISOString(),
      scheduledAt: type === 'task' ? (options?.scheduledAt ?? new Date().toISOString()) : undefined,
      color: folderColor,
    };
    persist([...nodes, newNode]);
    return newNode;
  }, [nodes, persist, getNodeDepth, generateId]);

  const updateNode = useCallback((id: string, updates: Partial<TaskNode>) => {
    persist(nodes.map(n => n.id === id ? { ...n, ...updates } : n));
  }, [nodes, persist]);

  const toggleExpanded = useCallback((id: string) => {
    persist(nodes.map(n => n.id === id ? { ...n, isExpanded: !n.isExpanded } : n));
  }, [nodes, persist]);

  const toggleTaskStatus = useCallback((id: string) => {
    persist(nodes.map(n => {
      if (n.id !== id || n.type !== 'task') return n;
      const newStatus: TaskStatus = n.status === 'TODO' ? 'DONE' : 'TODO';
      return {
        ...n,
        status: newStatus,
        completedAt: newStatus === 'DONE' ? new Date().toISOString() : undefined,
      };
    }));
  }, [nodes, persist]);

  return { addNode, updateNode, toggleExpanded, toggleTaskStatus };
}
