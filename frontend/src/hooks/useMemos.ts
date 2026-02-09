import { useState, useCallback, useEffect, useRef } from 'react';
import type { MemoNode } from '../types/memo';
import { STORAGE_KEYS } from '../constants/storageKeys';
import * as api from '../api/memoClient';

const STORAGE_KEY = STORAGE_KEYS.MEMOS;

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadLocalMemos(): MemoNode[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
}

function saveLocalMemos(memos: MemoNode[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
}

export function useMemos() {
  const [memos, setMemos] = useState<MemoNode[]>(loadLocalMemos);
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()));
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const syncPending = useRef(false);

  // Load from API on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const backendMemos = await api.fetchAllMemos();
        if (!cancelled) {
          setIsBackendAvailable(true);
          if (backendMemos.length > 0 || loadLocalMemos().length === 0) {
            setMemos(backendMemos);
            saveLocalMemos(backendMemos);
          }
        }
      } catch {
        if (!cancelled) {
          setIsBackendAvailable(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const syncMemoToBackend = useCallback((date: string, content: string) => {
    if (!isBackendAvailable) return;
    if (syncPending.current) return;
    syncPending.current = true;
    setTimeout(() => {
      api.upsertMemo(date, content).catch(() => {
        // Silently fail - localStorage is the fallback
      }).finally(() => {
        syncPending.current = false;
      });
    }, 500);
  }, [isBackendAvailable]);

  const upsertMemo = useCallback((date: string, content: string) => {
    setMemos(prev => {
      const existing = prev.find(m => m.date === date);
      const now = new Date().toISOString();
      let updated: MemoNode[];
      if (existing) {
        updated = prev.map(m => m.date === date ? { ...m, content, updatedAt: now } : m);
      } else {
        const newMemo: MemoNode = {
          id: `memo-${date}`,
          date,
          content,
          createdAt: now,
          updatedAt: now,
        };
        updated = [newMemo, ...prev];
      }
      saveLocalMemos(updated);
      return updated;
    });
    syncMemoToBackend(date, content);
  }, [syncMemoToBackend]);

  const deleteMemo = useCallback((date: string) => {
    setMemos(prev => {
      const updated = prev.filter(m => m.date !== date);
      saveLocalMemos(updated);
      return updated;
    });
    if (isBackendAvailable) {
      api.deleteMemo(date).catch(() => {});
    }
  }, [isBackendAvailable]);

  const getMemoForDate = useCallback((date: string): MemoNode | undefined => {
    return memos.find(m => m.date === date);
  }, [memos]);

  const selectedMemo = getMemoForDate(selectedDate);

  return {
    memos,
    selectedDate,
    setSelectedDate,
    selectedMemo,
    upsertMemo,
    deleteMemo,
    getMemoForDate,
  };
}
