import type { TaskNode } from '../types/taskTree';

export type SortMode = 'manual' | 'status' | 'scheduledAt';

export function sortTaskNodes(nodes: TaskNode[], mode: SortMode): TaskNode[] {
  if (mode === 'manual') return nodes;

  const sorted = [...nodes];

  if (mode === 'status') {
    sorted.sort((a, b) => {
      const aCompleted = a.status === 'DONE' ? 1 : 0;
      const bCompleted = b.status === 'DONE' ? 1 : 0;
      if (aCompleted !== bCompleted) return aCompleted - bCompleted;
      return a.order - b.order;
    });
  }

  if (mode === 'scheduledAt') {
    sorted.sort((a, b) => {
      const aDate = a.scheduledAt ?? '';
      const bDate = b.scheduledAt ?? '';
      if (!aDate && !bDate) return a.order - b.order;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate.localeCompare(bDate);
    });
  }

  return sorted;
}
