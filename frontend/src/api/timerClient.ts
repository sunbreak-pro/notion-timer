import type { TimerSettings, TimerSession, SessionType } from '../types/timer';

export async function fetchTimerSettings(): Promise<TimerSettings> {
  const res = await fetch('/api/timer-settings');
  if (!res.ok) throw new Error(`Failed to fetch timer settings: ${res.status}`);
  return res.json();
}

export async function updateTimerSettings(settings: Partial<Pick<TimerSettings, 'workDuration' | 'breakDuration' | 'longBreakDuration' | 'sessionsBeforeLongBreak'>>): Promise<TimerSettings> {
  const res = await fetch('/api/timer-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`Failed to update timer settings: ${res.status}`);
  return res.json();
}

export async function startTimerSession(sessionType: SessionType, taskId?: string): Promise<TimerSession> {
  const res = await fetch('/api/timer-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionType, taskId: taskId ?? null }),
  });
  if (!res.ok) throw new Error(`Failed to start timer session: ${res.status}`);
  return res.json();
}

export async function endTimerSession(id: number, duration: number, completed: boolean): Promise<TimerSession> {
  const res = await fetch(`/api/timer-sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration, completed }),
  });
  if (!res.ok) throw new Error(`Failed to end timer session: ${res.status}`);
  return res.json();
}

export async function fetchTimerSessions(): Promise<TimerSession[]> {
  const res = await fetch('/api/timer-sessions');
  if (!res.ok) throw new Error(`Failed to fetch timer sessions: ${res.status}`);
  return res.json();
}

export async function fetchSessionsByTaskId(taskId: string): Promise<TimerSession[]> {
  const res = await fetch(`/api/tasks/${taskId}/sessions`);
  if (!res.ok) throw new Error(`Failed to fetch sessions for task: ${res.status}`);
  return res.json();
}
