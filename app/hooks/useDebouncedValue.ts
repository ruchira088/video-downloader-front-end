import { useEffect, useState } from "react"

/**
 * Returns `value` delayed by `delayMs`, resetting the delay on every change. Used to keep
 * fast-changing input (a search field) from driving one request — and one history entry —
 * per keystroke.
 */
export function useDebouncedValue<A>(value: A, delayMs: number): A {
  const [debouncedValue, setDebouncedValue] = useState<A>(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs)

    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debouncedValue
}
