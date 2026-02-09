import { useMemo } from 'react';
import type { TaskNode } from '../types/taskTree';

export function useCalendar(
  nodes: TaskNode[],
  year: number,
  month: number,
  filter: 'incomplete' | 'completed',
  weekStartDate?: Date,
) {
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskNode[]>();
    const filtered = filter === 'completed'
      ? nodes.filter(n => n.type === 'task' && n.status === 'DONE')
      : nodes.filter(n => n.type === 'task' && n.status !== 'DONE');

    for (const task of filtered) {
      const dateStr = task.scheduledAt ?? task.createdAt;
      if (!dateStr) continue;
      const key = dateStr.substring(0, 10); // "YYYY-MM-DD"
      const existing = map.get(key);
      if (existing) {
        existing.push(task);
      } else {
        map.set(key, [task]);
      }
    }
    return map;
  }, [nodes, filter]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    // Next month padding to fill 6 rows
    while (days.length < 42) {
      const d = new Date(year, month + 1, days.length - daysInMonth - startDayOfWeek + 1);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const weekDays = useMemo(() => {
    const anchor = weekStartDate ?? new Date();
    const startOfWeek = new Date(anchor);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return { date: d, isCurrentMonth: d.getMonth() === month };
    });
  }, [weekStartDate, month]);

  return { tasksByDate, calendarDays, weekDays };
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
