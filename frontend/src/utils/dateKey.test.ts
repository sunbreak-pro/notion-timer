import { describe, it, expect } from 'vitest';
import { formatDateKey } from './dateKey';

describe('formatDateKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDateKey(new Date(2025, 0, 15))).toBe('2025-01-15');
  });

  it('pads single-digit months', () => {
    expect(formatDateKey(new Date(2025, 2, 5))).toBe('2025-03-05');
  });

  it('pads single-digit days', () => {
    expect(formatDateKey(new Date(2025, 11, 1))).toBe('2025-12-01');
  });

  it('handles Dec 31', () => {
    expect(formatDateKey(new Date(2025, 11, 31))).toBe('2025-12-31');
  });

  it('handles Jan 1', () => {
    expect(formatDateKey(new Date(2025, 0, 1))).toBe('2025-01-01');
  });

  it('uses local date (not UTC)', () => {
    // Create a date at midnight local time
    const d = new Date(2025, 5, 15, 0, 0, 0);
    expect(formatDateKey(d)).toBe('2025-06-15');
  });
});
