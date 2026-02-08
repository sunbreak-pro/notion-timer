import { useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { migrateTasksToBackend, fetchTaskTree } from '../api/taskClient';
import type { TaskNode } from '../types/taskTree';

export function useMigration() {
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const migrationDone = localStorage.getItem(STORAGE_KEYS.MIGRATION_DONE);
    if (migrationDone === 'true') return;

    const localData = localStorage.getItem(STORAGE_KEYS.TASK_TREE);
    if (!localData) return;

    let localNodes: TaskNode[];
    try {
      localNodes = JSON.parse(localData);
    } catch {
      return;
    }
    if (localNodes.length === 0) return;

    (async () => {
      try {
        const backendTasks = await fetchTaskTree();
        if (backendTasks.length > 0) {
          // Backend already has data, skip migration
          localStorage.setItem(STORAGE_KEYS.MIGRATION_DONE, 'true');
          return;
        }

        await migrateTasksToBackend(localNodes);
        localStorage.setItem(STORAGE_KEYS.MIGRATION_DONE, 'true');
      } catch {
        // Backend not available, skip migration for now
      }
    })();
  }, []);
}
