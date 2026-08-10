import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useDebouncedValue } from "~/hooks/useDebouncedValue"

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("first", 300))

    expect(result.current).toBe("first")
  })

  test("should not return a new value before the delay elapses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "first" },
    })

    rerender({ value: "second" })
    act(() => {
      vi.advanceTimersByTime(299)
    })

    expect(result.current).toBe("first")
  })

  test("should return the new value once the delay elapses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "first" },
    })

    rerender({ value: "second" })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe("second")
  })

  test("should emit only the settled value when it changes repeatedly", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "" },
    })

    for (const value of ["h", "ho", "hol"]) {
      rerender({ value })
      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(result.current).toBe("")
    }

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe("hol")
  })

  test("should work with non-string values", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 50), {
      initialProps: { value: 1 },
    })

    rerender({ value: 2 })
    act(() => {
      vi.advanceTimersByTime(50)
    })

    expect(result.current).toBe(2)
  })
})
