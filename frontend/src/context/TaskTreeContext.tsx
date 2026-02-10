import type { ReactNode } from 'react';
import { useTaskTreeAPI } from '../hooks/useTaskTreeAPI';
import { TaskTreeContext } from './TaskTreeContextValue';

export function TaskTreeProvider({ children }: { children: ReactNode }) {
  const taskTree = useTaskTreeAPI();
  return (
    <TaskTreeContext.Provider value={taskTree}>
      {children}
    </TaskTreeContext.Provider>
  );
}
