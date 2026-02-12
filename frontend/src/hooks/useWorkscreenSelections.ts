import { useState, useEffect, useCallback, useRef } from 'react';
import { getDataService } from '../services';
import { logServiceError } from '../utils/logError';

const MAX_PER_PHASE = 6;

export function useWorkscreenSelections() {
  const [selections, setSelections] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    getDataService().fetchWorkscreenSelections()
      .then((rows) => {
        setSelections(rows.map(r => r.soundId));
        setLoaded(true);
      })
      .catch(err => {
        logServiceError('WorkscreenSelections', 'load', err);
        setLoaded(true);
      });
  }, []);

  const persist = useCallback(async (ids: string[]) => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      await getDataService().setWorkscreenSelections(ids);
    } catch (err) {
      logServiceError('WorkscreenSelections', 'save', err);
    } finally {
      savingRef.current = false;
    }
  }, []);

  const toggleSelection = useCallback((soundId: string) => {
    setSelections(prev => {
      let next: string[];
      if (prev.includes(soundId)) {
        next = prev.filter(id => id !== soundId);
      } else {
        if (prev.length >= MAX_PER_PHASE) return prev;
        next = [...prev, soundId];
      }
      persist(next);
      return next;
    });
  }, [persist]);

  const isSelected = useCallback((soundId: string): boolean => {
    return selections.includes(soundId);
  }, [selections]);

  return { selections, loaded, toggleSelection, isSelected };
}
