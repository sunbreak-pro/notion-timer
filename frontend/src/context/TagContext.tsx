import { createContext } from 'react';
import type { ReactNode } from 'react';
import { useTags } from '../hooks/useTags';

export type TagOperations = ReturnType<typeof useTags>;

export interface TagContextValue {
  taskTags: TagOperations;
  noteTags: TagOperations;
}

export const TagContext = createContext<TagContextValue | null>(null);

export function TagProvider({ children }: { children: ReactNode }) {
  const taskTagState = useTags('task');
  const noteTagState = useTags('note');
  return (
    <TagContext.Provider value={{ taskTags: taskTagState, noteTags: noteTagState }}>
      {children}
    </TagContext.Provider>
  );
}
