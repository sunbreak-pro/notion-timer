import { useState, useCallback } from 'react';
import type { TaskNode, NodeType, TaskStatus } from '../types/taskTree';
import { mockTaskTree } from '../mocks/taskTree';
import { STORAGE_KEYS } from '../constants/storageKeys';

const STORAGE_KEY = STORAGE_KEYS.TASK_TREE;

function loadNodes(): TaskNode[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
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

  const activeNodes = nodes.filter(n => !n.isDeleted);
  const deletedNodes = nodes.filter(n => n.isDeleted);

  const getChildren = useCallback((parentId: string | null) => {
    return activeNodes
      .filter(n => n.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }, [activeNodes]);

  const addNode = useCallback((type: NodeType, parentId: string | null, title: string) => {
    const siblings = nodes.filter(n => !n.isDeleted && n.parentId === parentId);
    const newNode: TaskNode = {
      id: generateId(type),
      type,
      title,
      parentId,
      order: siblings.length,
      status: type === 'task' ? 'TODO' : undefined,
      isExpanded: type !== 'task' ? true : undefined,
      createdAt: new Date().toISOString(),
    };
    persist([...nodes, newNode]);
    return newNode;
  }, [nodes, persist]);

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

  const softDelete = useCallback((id: string) => {
    const descendantIds = new Set<string>();
    const collectDescendants = (parentId: string) => {
      nodes.filter(n => n.parentId === parentId).forEach(child => {
        descendantIds.add(child.id);
        collectDescendants(child.id);
      });
    };
    descendantIds.add(id);
    collectDescendants(id);

    persist(nodes.map(n =>
      descendantIds.has(n.id)
        ? { ...n, isDeleted: true, deletedAt: new Date().toISOString() }
        : n
    ));
  }, [nodes, persist]);

  const restoreNode = useCallback((id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    const idsToRestore = new Set<string>();
    const collectDescendants = (parentId: string) => {
      nodes.filter(n => n.parentId === parentId).forEach(child => {
        idsToRestore.add(child.id);
        collectDescendants(child.id);
      });
    };
    idsToRestore.add(id);
    collectDescendants(id);

    // Also restore ancestors if they're deleted
    let current = node;
    while (current.parentId) {
      const parent = nodes.find(n => n.id === current.parentId);
      if (parent && parent.isDeleted) {
        idsToRestore.add(parent.id);
      }
      if (!parent) break;
      current = parent;
    }

    persist(nodes.map(n =>
      idsToRestore.has(n.id)
        ? { ...n, isDeleted: false, deletedAt: undefined }
        : n
    ));
  }, [nodes, persist]);

  const permanentDelete = useCallback((id: string) => {
    const idsToDelete = new Set<string>();
    const collectDescendants = (parentId: string) => {
      nodes.filter(n => n.parentId === parentId).forEach(child => {
        idsToDelete.add(child.id);
        collectDescendants(child.id);
      });
    };
    idsToDelete.add(id);
    collectDescendants(id);
    persist(nodes.filter(n => !idsToDelete.has(n.id)));
  }, [nodes, persist]);

  const moveNodeInto = useCallback((activeId: string, targetFolderId: string) => {
    const active = nodes.find(n => n.id === activeId);
    const target = nodes.find(n => n.id === targetFolderId);
    if (!active || !target) return;

    // Target must be a folder or subfolder
    if (target.type === 'task') return;

    // Prevent circular reference
    const isDescendant = (parentId: string, childId: string): boolean => {
      const children = nodes.filter(n => n.parentId === parentId);
      return children.some(c => c.id === childId || isDescendant(c.id, childId));
    };
    if (isDescendant(activeId, targetFolderId)) return;

    // Hierarchy constraints
    if (active.type === 'folder') return; // folders stay at root
    if (active.type === 'subfolder' && target.type !== 'folder') return;

    // Already in this folder
    if (active.parentId === targetFolderId) return;

    // Add to end of target's children
    const targetChildren = nodes
      .filter(n => !n.isDeleted && n.parentId === targetFolderId)
      .sort((a, b) => a.order - b.order);
    const newOrder = targetChildren.length;

    // Reorder old siblings
    const oldSiblings = nodes
      .filter(n => !n.isDeleted && n.parentId === active.parentId && n.id !== activeId)
      .sort((a, b) => a.order - b.order);
    const orderMap = new Map(oldSiblings.map((n, i) => [n.id, i]));

    persist(nodes.map(n => {
      if (n.id === activeId) {
        return { ...n, parentId: targetFolderId, order: newOrder };
      }
      if (orderMap.has(n.id)) {
        return { ...n, order: orderMap.get(n.id)! };
      }
      return n;
    }));
  }, [nodes, persist]);

  const moveToRoot = useCallback((activeId: string) => {
    const active = nodes.find(n => n.id === activeId);
    if (!active || active.parentId === null) return;

    // Only tasks can be moved to root (Inbox)
    if (active.type !== 'task') return;

    const rootChildren = nodes
      .filter(n => !n.isDeleted && n.parentId === null)
      .sort((a, b) => a.order - b.order);
    const newOrder = rootChildren.length;

    // Reorder old siblings
    const oldSiblings = nodes
      .filter(n => !n.isDeleted && n.parentId === active.parentId && n.id !== activeId)
      .sort((a, b) => a.order - b.order);
    const orderMap = new Map(oldSiblings.map((n, i) => [n.id, i]));

    persist(nodes.map(n => {
      if (n.id === activeId) {
        return { ...n, parentId: null, order: newOrder };
      }
      if (orderMap.has(n.id)) {
        return { ...n, order: orderMap.get(n.id)! };
      }
      return n;
    }));
  }, [nodes, persist]);

  const moveNode = useCallback((activeId: string, overId: string) => {
    const active = nodes.find(n => n.id === activeId);
    const over = nodes.find(n => n.id === overId);
    if (!active || !over) return;

    // Prevent dropping into own descendants
    const isDescendant = (parentId: string, childId: string): boolean => {
      const children = nodes.filter(n => n.parentId === parentId);
      return children.some(c => c.id === childId || isDescendant(c.id, childId));
    };
    if (isDescendant(activeId, overId)) return;

    // Same parent: reorder
    if (active.parentId === over.parentId) {
      const siblings = nodes
        .filter(n => !n.isDeleted && n.parentId === active.parentId)
        .sort((a, b) => a.order - b.order);
      const oldIndex = siblings.findIndex(n => n.id === activeId);
      const newIndex = siblings.findIndex(n => n.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...siblings];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const orderMap = new Map(reordered.map((n, i) => [n.id, i]));
      persist(nodes.map(n => orderMap.has(n.id) ? { ...n, order: orderMap.get(n.id)! } : n));
    } else {
      // Different parent: move to over's parent at over's position
      const newParentId = over.parentId;

      // Validate hierarchy constraints
      if (active.type === 'folder' && newParentId !== null) return;
      if (active.type === 'subfolder') {
        const parent = nodes.find(n => n.id === newParentId);
        if (!parent || parent.type !== 'folder') return;
      }
      if (active.type === 'task' && newParentId !== null) {
        const parent = nodes.find(n => n.id === newParentId);
        if (!parent || (parent.type !== 'folder' && parent.type !== 'subfolder')) return;
      }

      const newSiblings = nodes
        .filter(n => !n.isDeleted && n.parentId === newParentId && n.id !== activeId)
        .sort((a, b) => a.order - b.order);
      const overIndex = newSiblings.findIndex(n => n.id === overId);
      newSiblings.splice(overIndex === -1 ? newSiblings.length : overIndex, 0, active);

      const orderMap = new Map(newSiblings.map((n, i) => [n.id, i]));

      // Reorder old siblings
      const oldSiblings = nodes
        .filter(n => !n.isDeleted && n.parentId === active.parentId && n.id !== activeId)
        .sort((a, b) => a.order - b.order);
      oldSiblings.forEach((n, i) => orderMap.set(n.id, i));

      persist(nodes.map(n => {
        if (n.id === activeId) {
          return { ...n, parentId: newParentId, order: orderMap.get(n.id) ?? 0 };
        }
        if (orderMap.has(n.id)) {
          return { ...n, order: orderMap.get(n.id)! };
        }
        return n;
      }));
    }
  }, [nodes, persist]);

  const promoteToFolder = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'subfolder') return;

    const rootChildren = nodes
      .filter(n => !n.isDeleted && n.parentId === null);
    const newOrder = rootChildren.length;

    // Reorder old siblings
    const oldSiblings = nodes
      .filter(n => !n.isDeleted && n.parentId === node.parentId && n.id !== nodeId)
      .sort((a, b) => a.order - b.order);
    const orderMap = new Map(oldSiblings.map((n, i) => [n.id, i]));

    persist(nodes.map(n => {
      if (n.id === nodeId) return { ...n, type: 'folder' as const, parentId: null, order: newOrder };
      if (orderMap.has(n.id)) return { ...n, order: orderMap.get(n.id)! };
      return n;
    }));
  }, [nodes, persist]);

  return {
    nodes: activeNodes,
    deletedNodes,
    getChildren,
    addNode,
    updateNode,
    toggleExpanded,
    toggleTaskStatus,
    softDelete,
    restoreNode,
    permanentDelete,
    moveNode,
    moveNodeInto,
    moveToRoot,
    promoteToFolder,
  };
}
