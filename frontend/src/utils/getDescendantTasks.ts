import type { TaskNode } from '../types/taskTree';

/**
 * Recursively collects all descendant tasks under a given folder.
 * Returns tasks at all nesting levels (not just direct children).
 */
export function getDescendantTasks(folderId: string, allNodes: TaskNode[]): TaskNode[] {
  const childrenMap = new Map<string | null, TaskNode[]>();
  for (const node of allNodes) {
    const pid = node.parentId;
    const list = childrenMap.get(pid);
    if (list) {
      list.push(node);
    } else {
      childrenMap.set(pid, [node]);
    }
  }

  const result: TaskNode[] = [];
  const stack = [folderId];
  while (stack.length > 0) {
    const parentId = stack.pop()!;
    const children = childrenMap.get(parentId);
    if (!children) continue;
    for (const child of children) {
      result.push(child);
      if (child.type === 'folder') {
        stack.push(child.id);
      }
    }
  }
  return result;
}
