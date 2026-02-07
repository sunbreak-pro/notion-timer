import type { TaskNode } from '../types/taskTree';

export function getAncestors(taskId: string, nodes: TaskNode[]): TaskNode[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const ancestors: TaskNode[] = [];
  let current = nodeMap.get(taskId);

  while (current?.parentId) {
    const parent = nodeMap.get(current.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }

  return ancestors;
}
