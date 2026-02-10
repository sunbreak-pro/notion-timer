import { useContext } from 'react';
import { TaskTreeContext } from '../context/TaskTreeContextValue';

export function useTaskTreeContext() {
  const context = useContext(TaskTreeContext);
  if (!context) {
    throw new Error('useTaskTreeContext must be used within a TaskTreeProvider');
  }
  return context;
}
