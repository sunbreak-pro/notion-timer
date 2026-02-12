import { describe, it, expect } from 'vitest';
import type { TimerSession } from '../types/timer';
import { aggregateByDay, aggregateByTask, computeSummary } from './analyticsAggregation';

function makeSession(overrides: Partial<TimerSession> = {}): TimerSession {
  return {
    id: 1,
    taskId: 'task-1',
    sessionType: 'WORK',
    startedAt: new Date(),
    completedAt: new Date(),
    duration: 1500, // 25 minutes in seconds
    completed: true,
    ...overrides,
  };
}

describe('aggregateByDay', () => {
  it('returns buckets for requested number of days', () => {
    const result = aggregateByDay([], 7);
    expect(result).toHaveLength(7);
  });

  it('aggregates session durations correctly', () => {
    const today = new Date();
    const sessions = [
      makeSession({ startedAt: today, duration: 1500 }),
      makeSession({ id: 2, startedAt: today, duration: 600 }),
    ];
    const result = aggregateByDay(sessions, 1);
    expect(result).toHaveLength(1);
    expect(result[0].totalMinutes).toBeCloseTo(35); // (1500+600)/60
    expect(result[0].sessionCount).toBe(2);
  });

  it('filters out non-WORK sessions', () => {
    const today = new Date();
    const sessions = [
      makeSession({ startedAt: today, duration: 1500 }),
      makeSession({ id: 2, startedAt: today, duration: 300, sessionType: 'BREAK' }),
    ];
    const result = aggregateByDay(sessions, 1);
    expect(result[0].totalMinutes).toBeCloseTo(25);
    expect(result[0].sessionCount).toBe(1);
  });

  it('filters out sessions with zero duration', () => {
    const today = new Date();
    const sessions = [
      makeSession({ startedAt: today, duration: 0 }),
    ];
    const result = aggregateByDay(sessions, 1);
    expect(result[0].sessionCount).toBe(0);
  });
});

describe('aggregateByTask', () => {
  it('groups sessions by task', () => {
    const sessions = [
      makeSession({ taskId: 'task-1', duration: 1500 }),
      makeSession({ id: 2, taskId: 'task-2', duration: 600 }),
      makeSession({ id: 3, taskId: 'task-1', duration: 300 }),
    ];
    const nameMap = new Map([
      ['task-1', 'Task One'],
      ['task-2', 'Task Two'],
    ]);
    const result = aggregateByTask(sessions, nameMap);
    expect(result).toHaveLength(2);

    const task1 = result.find(b => b.taskId === 'task-1');
    expect(task1).toBeDefined();
    expect(task1!.totalMinutes).toBeCloseTo(30); // (1500+300)/60
    expect(task1!.sessionCount).toBe(2);
  });

  it('handles sessions without task ID', () => {
    const sessions = [makeSession({ taskId: null, duration: 600 })];
    const result = aggregateByTask(sessions, new Map());
    expect(result).toHaveLength(1);
    expect(result[0].taskName).toBe('No Task');
  });

  it('limits to 10 tasks', () => {
    const sessions = Array.from({ length: 15 }, (_, i) =>
      makeSession({ id: i, taskId: `task-${i}`, duration: 600 })
    );
    const nameMap = new Map(sessions.map(s => [s.taskId!, `Task ${s.taskId}`]));
    const result = aggregateByTask(sessions, nameMap);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});

describe('computeSummary', () => {
  it('computes total minutes and sessions', () => {
    const sessions = [
      makeSession({ duration: 1500 }),
      makeSession({ id: 2, duration: 600 }),
    ];
    const summary = computeSummary(sessions);
    expect(summary.totalMinutes).toBeCloseTo(35);
    expect(summary.totalSessions).toBe(2);
  });

  it('returns zero for empty sessions', () => {
    const summary = computeSummary([]);
    expect(summary.totalMinutes).toBe(0);
    expect(summary.totalSessions).toBe(0);
    expect(summary.avgMinutesPerDay).toBe(0);
  });

  it('computes average minutes per unique day', () => {
    const day1 = new Date(2025, 0, 1);
    const day2 = new Date(2025, 0, 2);
    const sessions = [
      makeSession({ startedAt: day1, duration: 1500 }),
      makeSession({ id: 2, startedAt: day1, duration: 1500 }),
      makeSession({ id: 3, startedAt: day2, duration: 600 }),
    ];
    const summary = computeSummary(sessions);
    // Total: 3600s = 60min across 2 days → 30 min/day
    expect(summary.avgMinutesPerDay).toBeCloseTo(30);
  });
});
