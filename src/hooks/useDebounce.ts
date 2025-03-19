import { useState, useEffect } from 'react'

/**
 * Custom hook for debouncing rapidly changing values
 *
 * @param value The value to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced value
 */
export default function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up debounce timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup on value change or unmount
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
