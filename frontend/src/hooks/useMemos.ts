import { useState, useCallback, useEffect, useMemo } from 'react';
import type { MemoNode } from '../types/memo';
import { getDataService } from '../services';
import { logServiceError } from '../utils/logError';

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useMemos() {
  const [memos, setMemos] = useState<MemoNode[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()));

  // Load from DataService on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await getDataService().fetchAllMemos();
        if (!cancelled) {
          setMemos(loaded);
        }
      } catch (e) {
        logServiceError('Memo', 'fetch', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const upsertMemo = useCallback((date: string, content: string) => {
    setMemos(prev => {
      const existing = prev.find(m => m.date === date);
      const now = new Date().toISOString();
      if (existing) {
        return prev.map(m => m.date === date ? { ...m, content, updatedAt: now } : m);
      } else {
        const newMemo: MemoNode = {
          id: `memo-${date}`,
          date,
          content,
          createdAt: now,
          updatedAt: now,
        };
        return [newMemo, ...prev];
      }
    });
    getDataService().upsertMemo(date, content).catch((e) => logServiceError('Memo', 'sync', e));
  }, []);

  const deleteMemo = useCallback((date: string) => {
    setMemos(prev => prev.filter(m => m.date !== date));
    getDataService().deleteMemo(date).catch((e) => logServiceError('Memo', 'delete', e));
  }, []);

  const getMemoForDate = useCallback((date: string): MemoNode | undefined => {
    return memos.find(m => m.date === date);
  }, [memos]);

  const selectedMemo = getMemoForDate(selectedDate);

  return useMemo(() => ({
    memos,
    selectedDate,
    setSelectedDate,
    selectedMemo,
    upsertMemo,
    deleteMemo,
    getMemoForDate,
  }), [memos, selectedDate, selectedMemo, upsertMemo, deleteMemo, getMemoForDate]);
}
