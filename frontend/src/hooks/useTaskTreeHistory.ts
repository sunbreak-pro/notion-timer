import {
  useState,
  useCallback,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { TaskNode } from "../types/taskTree";

const MAX_HISTORY_SIZE = 50;

export function useTaskTreeHistory(
  setNodes: Dispatch<SetStateAction<TaskNode[]>>,
  syncToDb: (nodes: TaskNode[]) => void,
) {
  const undoStackRef = useRef<TaskNode[][]>([]);
  const redoStackRef = useRef<TaskNode[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const persistWithHistory = useCallback(
    (currentNodes: TaskNode[], updated: TaskNode[]) => {
      undoStackRef.current = [
        ...undoStackRef.current.slice(-(MAX_HISTORY_SIZE - 1)),
        currentNodes,
      ];
      redoStackRef.current = [];
      setNodes(updated);
      syncToDb(updated);
      updateFlags();
    },
    [setNodes, syncToDb, updateFlags],
  );

  const persistSilent = useCallback(
    (updated: TaskNode[]) => {
      setNodes(updated);
      syncToDb(updated);
    },
    [setNodes, syncToDb],
  );

  const undo = useCallback(() => {
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) return;

    setNodes((prev) => {
      redoStackRef.current.push(prev);
      updateFlags();
      syncToDb(snapshot);
      return snapshot;
    });
  }, [setNodes, syncToDb, updateFlags]);

  const redo = useCallback(() => {
    const snapshot = redoStackRef.current.pop();
    if (!snapshot) return;

    setNodes((prev) => {
      undoStackRef.current.push(prev);
      updateFlags();
      syncToDb(snapshot);
      return snapshot;
    });
  }, [setNodes, syncToDb, updateFlags]);

  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    updateFlags();
  }, [updateFlags]);

  return {
    persistWithHistory,
    persistSilent,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
}
