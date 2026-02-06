import type { ReactNode } from 'react';
import { useTaskTree } from '../hooks/useTaskTree';
import { TaskTreeContext } from './taskTreeContextValue';

export function TaskTreeProvider({ children }: { children: ReactNode }) {
  const taskTree = useTaskTree();
  return (
    <TaskTreeContext.Provider value={taskTree}>
      {children}
    </TaskTreeContext.Provider>
  );
}
