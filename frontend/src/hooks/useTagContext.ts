import { useContext } from 'react';
import { TagContext } from '../context/TagContext';

export function useTagContext() {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error('useTagContext must be used within a TagProvider');
  }
  return context;
}
