import type { TimerSession } from '../types/timer';

export interface DayBucket {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  sessionCount: number;
}

export interface TaskBucket {
  taskId: string;
  taskName: string;
  totalMinutes: number;
  sessionCount: number;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function getWorkSessions(sessions: TimerSession[]): TimerSession[] {
  return sessions.filter(s => s.sessionType === 'WORK' && s.duration != null && s.duration > 0);
}

export function aggregateByDay(sessions: TimerSession[], days: number): DayBucket[] {
  const work = getWorkSessions(sessions);
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);

  const map = new Map<string, DayBucket>();

  // Pre-fill all dates so there are no gaps
  for (let i = 0; i < days; i++) {
    const d = new Date(cutoff);
    d.setDate(d.getDate() + i);
    const key = toDateStr(d);
    map.set(key, { date: key, totalMinutes: 0, sessionCount: 0 });
  }

  for (const s of work) {
    const started = new Date(s.startedAt);
    const key = toDateStr(started);
    const bucket = map.get(key);
    if (bucket) {
      bucket.totalMinutes += (s.duration ?? 0) / 60;
      bucket.sessionCount += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateByWeek(sessions: TimerSession[], weeks: number): DayBucket[] {
  const work = getWorkSessions(sessions);
  const now = new Date();
  const currentWeekStart = startOfWeek(now);

  const map = new Map<string, DayBucket>();

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - i * 7);
    const key = toDateStr(d);
    map.set(key, { date: key, totalMinutes: 0, sessionCount: 0 });
  }

  for (const s of work) {
    const started = new Date(s.startedAt);
    const weekStart = startOfWeek(started);
    const key = toDateStr(weekStart);
    const bucket = map.get(key);
    if (bucket) {
      bucket.totalMinutes += (s.duration ?? 0) / 60;
      bucket.sessionCount += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateByMonth(sessions: TimerSession[], months: number): DayBucket[] {
  const work = getWorkSessions(sessions);
  const now = new Date();

  const map = new Map<string, DayBucket>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = toDateStr(startOfMonth(d));
    map.set(key, { date: key, totalMinutes: 0, sessionCount: 0 });
  }

  for (const s of work) {
    const started = new Date(s.startedAt);
    const key = toDateStr(startOfMonth(started));
    const bucket = map.get(key);
    if (bucket) {
      bucket.totalMinutes += (s.duration ?? 0) / 60;
      bucket.sessionCount += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateByTask(
  sessions: TimerSession[],
  taskNameMap: Map<string, string>,
): TaskBucket[] {
  const work = getWorkSessions(sessions);
  const map = new Map<string, TaskBucket>();

  for (const s of work) {
    const tid = s.taskId ?? '__none__';
    let bucket = map.get(tid);
    if (!bucket) {
      bucket = {
        taskId: tid,
        taskName: taskNameMap.get(tid) ?? (tid === '__none__' ? 'No Task' : tid),
        totalMinutes: 0,
        sessionCount: 0,
      };
      map.set(tid, bucket);
    }
    bucket.totalMinutes += (s.duration ?? 0) / 60;
    bucket.sessionCount += 1;
  }

  return Array.from(map.values())
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 10);
}

export function computeSummary(sessions: TimerSession[]) {
  const work = getWorkSessions(sessions);
  const totalMinutes = work.reduce((sum, s) => sum + (s.duration ?? 0) / 60, 0);
  const totalSessions = work.length;

  const uniqueDays = new Set(work.map(s => toDateStr(new Date(s.startedAt)))).size;
  const avgMinutesPerDay = uniqueDays > 0 ? totalMinutes / uniqueDays : 0;

  return { totalMinutes, totalSessions, avgMinutesPerDay };
}
