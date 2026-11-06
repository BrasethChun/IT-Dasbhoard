import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value changes (e.g., search queries, text input filters).
 * @param value The raw input value
 * @param delay Milliseconds to wait before updating the debounced value (default 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
