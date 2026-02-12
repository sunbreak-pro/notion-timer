import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useClickOutside } from './useClickOutside';

function createMockRef(contains: boolean) {
  return {
    current: {
      contains: () => contains,
    } as unknown as HTMLElement,
  };
}

describe('useClickOutside', () => {
  it('calls handler when clicking outside the ref', () => {
    const handler = vi.fn();
    const ref = createMockRef(false);

    renderHook(() => useClickOutside(ref as ReturnType<typeof useRef<HTMLElement | null>>, handler));

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call handler when clicking inside the ref', () => {
    const handler = vi.fn();
    const ref = createMockRef(true);

    renderHook(() => useClickOutside(ref as ReturnType<typeof useRef<HTMLElement | null>>, handler));

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call handler when enabled is false', () => {
    const handler = vi.fn();
    const ref = createMockRef(false);

    renderHook(() => useClickOutside(ref as ReturnType<typeof useRef<HTMLElement | null>>, handler, false));

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call handler when ref.current is null', () => {
    const handler = vi.fn();
    const ref = { current: null };

    renderHook(() => useClickOutside(ref, handler));

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const handler = vi.fn();
    const ref = createMockRef(false);

    const { unmount } = renderHook(() => useClickOutside(ref as ReturnType<typeof useRef<HTMLElement | null>>, handler));
    unmount();

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });
});
