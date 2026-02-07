import { useState, useCallback } from 'react';

type SetAction<T> = T | ((prev: T) => T);

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (raw: string) => T;
  }
): [T, (value: SetAction<T>) => void] {
  const serialize = options?.serialize ?? JSON.stringify;
  const deserialize = options?.deserialize ?? JSON.parse;

  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return deserialize(stored);
      }
    } catch { /* fall through */ }
    return defaultValue;
  });

  const set = useCallback((action: SetAction<T>) => {
    setValue(prev => {
      const newValue = action instanceof Function ? action(prev) : action;
      try {
        localStorage.setItem(key, serialize(newValue));
      } catch { /* ignore quota errors */ }
      return newValue;
    });
  }, [key, serialize]);

  return [value, set];
}
