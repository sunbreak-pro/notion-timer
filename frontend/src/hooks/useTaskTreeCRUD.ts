import { useCallback } from 'react';
import type { TaskNode, NodeType, TaskStatus } from '../types/taskTree';
import { MAX_FOLDER_DEPTH } from '../types/taskTree';
import { getColorByIndex } from '../constants/folderColors';

interface AddNodeOptions {
  scheduledAt?: string;
  scheduledEndAt?: string;
  isAllDay?: boolean;
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
      status: 'TODO',
      isExpanded: type !== 'task' ? true : undefined,
      createdAt: new Date().toISOString(),
      scheduledAt: type === 'task' ? options?.scheduledAt : undefined,
      scheduledEndAt: type === 'task' ? options?.scheduledEndAt : undefined,
      isAllDay: type === 'task' ? options?.isAllDay : undefined,
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

  const completeFolderWithChildren = useCallback((folderId: string) => {
    const now = new Date().toISOString();
    const idsToComplete = new Set<string>();

    const collectDescendants = (parentId: string) => {
      idsToComplete.add(parentId);
      for (const n of nodes) {
        if (!n.isDeleted && n.parentId === parentId) {
          if (n.type === 'folder') {
            collectDescendants(n.id);
          } else {
            idsToComplete.add(n.id);
          }
        }
      }
    };
    collectDescendants(folderId);

    persist(nodes.map(n =>
      idsToComplete.has(n.id) && n.status !== 'DONE'
        ? { ...n, status: 'DONE' as TaskStatus, completedAt: now }
        : n
    ));
  }, [nodes, persist]);

  const uncompleteFolder = useCallback((folderId: string) => {
    persist(nodes.map(n =>
      n.id === folderId
        ? { ...n, status: 'TODO' as TaskStatus, completedAt: undefined }
        : n
    ));
  }, [nodes, persist]);

  return { addNode, updateNode, toggleExpanded, toggleTaskStatus, completeFolderWithChildren, uncompleteFolder };
}
