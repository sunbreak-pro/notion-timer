import { useCallback } from "react";
import type { TaskNode } from "../types/taskTree";

export function useTaskTreeDeletion(
  nodes: TaskNode[],
  persistWithHistory: (currentNodes: TaskNode[], updated: TaskNode[]) => void,
  persistSilent: (updated: TaskNode[]) => void,
  clearHistory: () => void,
) {
  const softDelete = useCallback(
    (id: string) => {
      const descendantIds = new Set<string>();
      const collectDescendants = (parentId: string) => {
        nodes
          .filter((n) => n.parentId === parentId)
          .forEach((child) => {
            descendantIds.add(child.id);
            collectDescendants(child.id);
          });
      };
      descendantIds.add(id);
      collectDescendants(id);

      persistWithHistory(
        nodes,
        nodes.map((n) =>
          descendantIds.has(n.id)
            ? { ...n, isDeleted: true, deletedAt: new Date().toISOString() }
            : n,
        ),
      );
    },
    [nodes, persistWithHistory],
  );

  const restoreNode = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id);
      if (!node) return;

      const idsToRestore = new Set<string>();
      const collectDescendants = (parentId: string) => {
        nodes
          .filter((n) => n.parentId === parentId)
          .forEach((child) => {
            idsToRestore.add(child.id);
            collectDescendants(child.id);
          });
      };
      idsToRestore.add(id);
      collectDescendants(id);

      // Also restore ancestors if they're deleted
      let current = node;
      while (current.parentId) {
        const parent = nodes.find((n) => n.id === current.parentId);
        if (parent && parent.isDeleted) {
          idsToRestore.add(parent.id);
        }
        if (!parent) break;
        current = parent;
      }

      persistWithHistory(
        nodes,
        nodes.map((n) =>
          idsToRestore.has(n.id)
            ? { ...n, isDeleted: false, deletedAt: undefined }
            : n,
        ),
      );
    },
    [nodes, persistWithHistory],
  );

  const permanentDelete = useCallback(
    (id: string) => {
      const idsToDelete = new Set<string>();
      const collectDescendants = (parentId: string) => {
        nodes
          .filter((n) => n.parentId === parentId)
          .forEach((child) => {
            idsToDelete.add(child.id);
            collectDescendants(child.id);
          });
      };
      idsToDelete.add(id);
      collectDescendants(id);
      persistSilent(nodes.filter((n) => !idsToDelete.has(n.id)));
      clearHistory();
    },
    [nodes, persistSilent, clearHistory],
  );

  return { softDelete, restoreNode, permanentDelete };
}
