import { useContext } from 'react';
import { TagContext } from '../context/TagContext';
import type { TagContextValue } from '../context/TagContext';

export function useTagContext(): TagContextValue {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error('useTagContext must be used within a TagProvider');
  }
  return context;
}
