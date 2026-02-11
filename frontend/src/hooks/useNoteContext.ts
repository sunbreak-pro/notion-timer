import { useContext } from 'react';
import { NoteContext } from '../context/NoteContext';

export function useNoteContext() {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error('useNoteContext must be used within a NoteProvider');
  }
  return context;
}
