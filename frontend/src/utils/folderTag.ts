import type { TaskNode } from '../types/taskTree';

export function getFolderTag(taskId: string, nodes: TaskNode[]): string {
  const node = nodes.find(n => n.id === taskId);
  if (!node) return '';

  const ancestors: string[] = [];
  let current = node;
  while (current.parentId) {
    const parent = nodes.find(n => n.id === current.parentId);
    if (!parent) break;
    if (parent.type === 'folder') {
      ancestors.unshift(parent.title);
    }
    current = parent;
  }

  return ancestors.join('/');
}
