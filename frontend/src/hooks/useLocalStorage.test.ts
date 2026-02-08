import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('reads existing value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('stored-value')
  })

  it('updates value and persists to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated')
  })

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-count', 0))

    act(() => {
      result.current[1]((prev) => prev + 1)
    })

    expect(result.current[0]).toBe(1)
  })

  it('handles complex objects', () => {
    const initial = { name: 'test', items: [1, 2, 3] }
    const { result } = renderHook(() => useLocalStorage('test-obj', initial))

    expect(result.current[0]).toEqual(initial)

    const updated = { name: 'updated', items: [4, 5] }
    act(() => {
      result.current[1](updated)
    })

    expect(result.current[0]).toEqual(updated)
    expect(JSON.parse(localStorage.getItem('test-obj')!)).toEqual(updated)
  })
})
