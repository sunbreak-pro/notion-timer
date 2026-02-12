import { useState, useEffect, useCallback, useRef } from 'react';
import { getDataService } from '../services';
import { logServiceError } from '../utils/logError';

const MAX_PER_PHASE = 6;

export interface WorkscreenSelections {
  work: string[];
  rest: string[];
}

export function useWorkscreenSelections() {
  const [selections, setSelections] = useState<WorkscreenSelections>({ work: [], rest: [] });
  const [loaded, setLoaded] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    const ds = getDataService();
    Promise.all([
      ds.fetchWorkscreenSelections('WORK'),
      ds.fetchWorkscreenSelections('REST'),
    ]).then(([workRows, restRows]) => {
      setSelections({
        work: workRows.map(r => r.soundId),
        rest: restRows.map(r => r.soundId),
      });
      setLoaded(true);
    }).catch(err => {
      logServiceError('WorkscreenSelections', 'load', err);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback(async (category: 'WORK' | 'REST', ids: string[]) => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      await getDataService().setWorkscreenSelections(category, ids);
    } catch (err) {
      logServiceError('WorkscreenSelections', 'save', err);
    } finally {
      savingRef.current = false;
    }
  }, []);

  const toggleSelection = useCallback((soundId: string, category: 'WORK' | 'REST') => {
    setSelections(prev => {
      const key = category === 'WORK' ? 'work' : 'rest';
      const list = prev[key];
      let next: string[];
      if (list.includes(soundId)) {
        next = list.filter(id => id !== soundId);
      } else {
        if (list.length >= MAX_PER_PHASE) return prev;
        next = [...list, soundId];
      }
      persist(category, next);
      return { ...prev, [key]: next };
    });
  }, [persist]);

  const isSelected = useCallback((soundId: string, category: 'WORK' | 'REST'): boolean => {
    const key = category === 'WORK' ? 'work' : 'rest';
    return selections[key].includes(soundId);
  }, [selections]);

  return { selections, loaded, toggleSelection, isSelected };
}
