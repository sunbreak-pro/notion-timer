import { useContext } from 'react';
import { TaskTreeContext } from '../context/taskTreeContextValue';

export function useTaskTreeContext() {
  const context = useContext(TaskTreeContext);
  if (!context) {
    throw new Error('useTaskTreeContext must be used within a TaskTreeProvider');
  }
  return context;
}
