import { describe, it, expect } from 'vitest'
import { formatDuration } from './duration'

describe('formatDuration', () => {
  it('formats minutes under 60', () => {
    expect(formatDuration(25)).toBe('25m')
    expect(formatDuration(5)).toBe('5m')
    expect(formatDuration(45)).toBe('45m')
  })

  it('formats exact hours', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(120)).toBe('2h')
  })

  it('formats hours with remaining minutes', () => {
    expect(formatDuration(90)).toBe('1h30m')
    expect(formatDuration(75)).toBe('1h15m')
  })
})
