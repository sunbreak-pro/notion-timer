import type { TaskNode } from '../types/taskTree';

export interface FolderProgress {
  completed: number;
  total: number;
}

export function computeFolderProgress(
  folderId: string,
  activeNodes: TaskNode[],
): FolderProgress {
  let completed = 0;
  let total = 0;

  const countDescendantTasks = (parentId: string) => {
    for (const n of activeNodes) {
      if (n.parentId !== parentId) continue;
      if (n.type === 'task') {
        total++;
        if (n.status === 'DONE') completed++;
      } else if (n.type === 'folder') {
        countDescendantTasks(n.id);
      }
    }
  };

  countDescendantTasks(folderId);
  return { completed, total };
}
