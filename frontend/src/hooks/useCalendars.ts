import { useState, useCallback, useEffect, useMemo } from 'react';
import type { CalendarNode } from '../types/calendar';
import { getDataService } from '../services';
import { STORAGE_KEYS } from '../constants/storageKeys';

export function useCalendars() {
  const [calendars, setCalendars] = useState<CalendarNode[]>([]);
  const [activeCalendarId, setActiveCalendarIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CALENDAR_ID) || null;
    } catch { return null; }
  });

  const setActiveCalendarId = useCallback((id: string | null) => {
    setActiveCalendarIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CALENDAR_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CALENDAR_ID);
      }
    } catch { /* ignore */ }
  }, []);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getDataService().fetchCalendars();
        if (!cancelled) setCalendars(data);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Derive a valid calendar ID (auto-reset if referenced calendar was deleted)
  const validActiveCalendarId = useMemo(() => {
    if (!activeCalendarId) return null;
    if (calendars.length > 0 && !calendars.find(c => c.id === activeCalendarId)) return null;
    return activeCalendarId;
  }, [activeCalendarId, calendars]);

  const activeCalendar = useMemo(() => {
    if (!validActiveCalendarId) return null;
    return calendars.find(c => c.id === validActiveCalendarId) ?? null;
  }, [calendars, validActiveCalendarId]);

  const createCalendar = useCallback(async (title: string, folderId: string) => {
    const id = `calendar-${crypto.randomUUID()}`;
    const cal = await getDataService().createCalendar(id, title, folderId);
    setCalendars(prev => [...prev, cal]);
    return cal;
  }, []);

  const updateCalendar = useCallback(async (id: string, updates: Partial<Pick<CalendarNode, 'title' | 'folderId' | 'order'>>) => {
    const updated = await getDataService().updateCalendar(id, updates);
    setCalendars(prev => prev.map(c => c.id === id ? updated : c));
  }, []);

  const deleteCalendar = useCallback(async (id: string) => {
    await getDataService().deleteCalendar(id);
    setCalendars(prev => prev.filter(c => c.id !== id));
    if (activeCalendarId === id) {
      setActiveCalendarIdState(null);
      try { localStorage.removeItem(STORAGE_KEYS.ACTIVE_CALENDAR_ID); } catch { /* ignore */ }
    }
  }, [activeCalendarId]);

  const refreshCalendars = useCallback(async () => {
    try {
      const data = await getDataService().fetchCalendars();
      setCalendars(data);
    } catch { /* ignore */ }
  }, []);

  return {
    calendars,
    activeCalendarId: validActiveCalendarId,
    activeCalendar,
    setActiveCalendarId,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    refreshCalendars,
  };
}
