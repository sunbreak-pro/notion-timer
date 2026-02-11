import { createContext } from 'react';
import type { ReactNode } from 'react';
import { useNotes } from '../hooks/useNotes';

export type NoteContextValue = ReturnType<typeof useNotes>;

export const NoteContext = createContext<NoteContextValue | null>(null);

export function NoteProvider({ children }: { children: ReactNode }) {
  const noteState = useNotes();
  return (
    <NoteContext.Provider value={noteState}>
      {children}
    </NoteContext.Provider>
  );
}
