import { createContext } from 'react';
import type { useTaskTree } from '../hooks/useTaskTree';

export type TaskTreeContextValue = ReturnType<typeof useTaskTree>;

export const TaskTreeContext = createContext<TaskTreeContextValue | null>(null);
