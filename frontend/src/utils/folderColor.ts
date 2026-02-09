import type { TaskNode } from '../types/taskTree';

export const INBOX_COLOR = '#D5E8F5'; // sky blue

export function resolveTaskColor(taskId: string, nodes: TaskNode[]): string | undefined {
  const node = nodes.find(n => n.id === taskId);
  if (!node) return undefined;

  if (node.type === 'folder' && node.color) return node.color;

  let current = node;
  while (current.parentId) {
    const parent = nodes.find(n => n.id === current.parentId);
    if (!parent) break;
    if (parent.type === 'folder' && parent.color) return parent.color;
    current = parent;
  }

  // Root tasks (no parent) get Inbox color
  if (node.type === 'task' && !node.parentId) return INBOX_COLOR;

  return undefined;
}
