import log from '../logger';
import { performance } from 'perf_hooks';

export interface ChannelMetrics {
  channel: string;
  callCount: number;
  totalMs: number;
  maxMs: number;
  avgMs: number;
  slowQueries: { timestamp: string; durationMs: number }[];
}

interface MetricsEntry {
  callCount: number;
  totalMs: number;
  maxMs: number;
  slowQueries: { timestamp: string; durationMs: number }[];
}

const SLOW_THRESHOLD_MS = 100;
const MAX_SLOW_QUERIES = 10;

const metricsStore = new Map<string, MetricsEntry>();

export function wrapHandler(
  channel: string,
  handler: (...args: unknown[]) => unknown,
): (...args: unknown[]) => Promise<unknown> {
  return async (...args: unknown[]) => {
    const start = performance.now();
    try {
      return await handler(...args);
    } finally {
      const durationMs = performance.now() - start;
      recordMetric(channel, durationMs);
    }
  };
}

function recordMetric(channel: string, durationMs: number): void {
  let entry = metricsStore.get(channel);
  if (!entry) {
    entry = { callCount: 0, totalMs: 0, maxMs: 0, slowQueries: [] };
    metricsStore.set(channel, entry);
  }

  entry.callCount++;
  entry.totalMs += durationMs;
  if (durationMs > entry.maxMs) entry.maxMs = durationMs;

  if (durationMs > SLOW_THRESHOLD_MS) {
    log.warn(`[IPC:Slow] ${channel} took ${durationMs.toFixed(1)}ms`);
    entry.slowQueries.push({
      timestamp: new Date().toISOString(),
      durationMs: Math.round(durationMs * 10) / 10,
    });
    if (entry.slowQueries.length > MAX_SLOW_QUERIES) {
      entry.slowQueries.shift();
    }
  }
}

export function getMetrics(): ChannelMetrics[] {
  const result: ChannelMetrics[] = [];
  for (const [channel, entry] of metricsStore) {
    result.push({
      channel,
      callCount: entry.callCount,
      totalMs: Math.round(entry.totalMs * 10) / 10,
      maxMs: Math.round(entry.maxMs * 10) / 10,
      avgMs: entry.callCount > 0
        ? Math.round((entry.totalMs / entry.callCount) * 10) / 10
        : 0,
      slowQueries: [...entry.slowQueries],
    });
  }
  return result.sort((a, b) => b.totalMs - a.totalMs);
}

export function resetMetrics(): void {
  metricsStore.clear();
}
