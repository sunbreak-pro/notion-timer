import { useContext } from 'react';
import { MemoContext } from '../context/MemoContext';

export function useMemoContext() {
  const context = useContext(MemoContext);
  if (!context) {
    throw new Error('useMemoContext must be used within a MemoProvider');
  }
  return context;
}
