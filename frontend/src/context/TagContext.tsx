import { createContext } from 'react';
import type { ReactNode } from 'react';
import { useTags } from '../hooks/useTags';

export type TagContextValue = ReturnType<typeof useTags>;

export const TagContext = createContext<TagContextValue | null>(null);

export function TagProvider({ children }: { children: ReactNode }) {
  const tagState = useTags();
  return (
    <TagContext.Provider value={tagState}>
      {children}
    </TagContext.Provider>
  );
}
