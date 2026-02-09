import { createContext } from 'react';
import type { ReactNode } from 'react';
import { useMemos } from '../hooks/useMemos';

export type MemoContextValue = ReturnType<typeof useMemos>;

export const MemoContext = createContext<MemoContextValue | null>(null);

export function MemoProvider({ children }: { children: ReactNode }) {
  const memoState = useMemos();
  return (
    <MemoContext.Provider value={memoState}>
      {children}
    </MemoContext.Provider>
  );
}
