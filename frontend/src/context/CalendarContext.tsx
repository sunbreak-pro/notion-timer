import { createContext } from 'react';
import type { ReactNode } from 'react';
import { useCalendars } from '../hooks/useCalendars';

export type CalendarContextValue = ReturnType<typeof useCalendars>;

export const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const calendarState = useCalendars();
  return (
    <CalendarContext.Provider value={calendarState}>
      {children}
    </CalendarContext.Provider>
  );
}
