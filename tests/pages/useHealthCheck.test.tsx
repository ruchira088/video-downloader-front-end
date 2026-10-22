import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { DateTime } from "luxon"
import { HEALTH_CHECK_POLL_INTERVAL_MS, useHealthCheck } from "~/pages/authenticated/service-information/useHealthCheck"
import { performHealthCheck } from "~/services/health/HealthCheckService"
import { HealthStatus, type HealthCheck } from "~/models/HealthCheck"
import { buildHealthCheck } from "../fixtures"

vi.mock("~/services/health/HealthCheckService", () => ({
  performHealthCheck: vi.fn()
}))

const healthCheckWithDatabase = (healthStatus: HealthStatus) =>
  buildHealthCheck({ database: { durationInMs: 10, healthStatus } })

const healthyCheck = healthCheckWithDatabase(HealthStatus.Healthy)
const unhealthyCheck = healthCheckWithDatabase(HealthStatus.Unhealthy)

/** A health check the test settles by hand, to control the order in which overlapping checks finish. */
const deferredHealthCheck = () => {
  let resolve: (healthCheck: HealthCheck) => void = () => {}
  const promise = new Promise<HealthCheck>((res) => { resolve = res })

  return { promise, resolve }
}

const databaseStatus = (result: { current: ReturnType<typeof useHealthCheck> }) =>
  result.current.healthCheckDetails.map((details) => details.database.healthStatus).toNullable()

/** Lets pending promise callbacks (and the state updates they make) run. */
const flush = () => act(async () => {})

describe("useHealthCheck", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(performHealthCheck).mockResolvedValue(healthyCheck)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test("should start empty and run a health check on mount", async () => {
    const { result } = renderHook(() => useHealthCheck())

    expect(result.current.healthCheckDetails.isEmpty()).toBe(true)
    expect(result.current.isRefreshing).toBe(false)
    expect(performHealthCheck).toHaveBeenCalledTimes(1)

    await flush()

    expect(databaseStatus(result)).toBe(HealthStatus.Healthy)
  })

  test("should stamp the result with the time it arrived", async () => {
    vi.setSystemTime(DateTime.fromISO("2024-01-15T10:30:00Z").toJSDate())

    const { result } = renderHook(() => useHealthCheck())
    await flush()

    expect(result.current.healthCheckDetails.map((details) => details.timestamp.toMillis()).toNullable())
      .toBe(DateTime.fromISO("2024-01-15T10:30:00Z").toMillis())
  })

  test("should poll every 30 seconds and stop polling on unmount", async () => {
    const { result, unmount } = renderHook(() => useHealthCheck())
    await flush()

    vi.mocked(performHealthCheck).mockResolvedValue(unhealthyCheck)
    await act(() => vi.advanceTimersByTimeAsync(HEALTH_CHECK_POLL_INTERVAL_MS - 1))
    expect(performHealthCheck).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(performHealthCheck).toHaveBeenCalledTimes(2)
    expect(databaseStatus(result)).toBe(HealthStatus.Unhealthy)
    // A poll is not a manual refresh.
    expect(result.current.isRefreshing).toBe(false)

    unmount()
    await act(() => vi.advanceTimersByTimeAsync(HEALTH_CHECK_POLL_INTERVAL_MS * 3))
    expect(performHealthCheck).toHaveBeenCalledTimes(2)
  })

  test("should flag a manual refresh while it is in flight and show its result", async () => {
    const { result } = renderHook(() => useHealthCheck())
    await flush()

    const check = deferredHealthCheck()
    vi.mocked(performHealthCheck).mockReturnValueOnce(check.promise)

    let refreshed: Promise<void> = Promise.resolve()
    act(() => { refreshed = result.current.refresh() })

    expect(result.current.isRefreshing).toBe(true)
    expect(performHealthCheck).toHaveBeenCalledTimes(2)

    await act(async () => {
      check.resolve(unhealthyCheck)
      await refreshed
    })

    expect(result.current.isRefreshing).toBe(false)
    expect(databaseStatus(result)).toBe(HealthStatus.Unhealthy)
  })

  test("should keep a stable refresh across renders", async () => {
    const { result } = renderHook(() => useHealthCheck())
    const initialRefresh = result.current.refresh

    await flush()

    expect(result.current.refresh).toBe(initialRefresh)
  })

  test("should log a failed check, keep the last result and resolve the refresh", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const { result } = renderHook(() => useHealthCheck())
    await flush()

    const error = new Error("health check failed")
    vi.mocked(performHealthCheck).mockRejectedValueOnce(error)

    await act(() => result.current.refresh())

    expect(consoleError).toHaveBeenCalledWith("Failed to perform the health check", error)
    expect(databaseStatus(result)).toBe(HealthStatus.Healthy)
    expect(result.current.isRefreshing).toBe(false)

    consoleError.mockRestore()
  })

  test("should stay empty when the first check fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(performHealthCheck).mockRejectedValueOnce(new Error("health check failed"))

    const { result } = renderHook(() => useHealthCheck())
    await flush()

    expect(result.current.healthCheckDetails.isEmpty()).toBe(true)
    expect(consoleError).toHaveBeenCalledTimes(1)

    consoleError.mockRestore()
  })

  test("should drop an older result that settles after a newer one is shown", async () => {
    const { result } = renderHook(() => useHealthCheck())
    await flush()

    const polledCheck = deferredHealthCheck()
    vi.mocked(performHealthCheck)
      .mockReturnValueOnce(polledCheck.promise)
      .mockResolvedValueOnce(unhealthyCheck)

    await act(() => vi.advanceTimersByTimeAsync(HEALTH_CHECK_POLL_INTERVAL_MS))
    await act(() => result.current.refresh())
    expect(databaseStatus(result)).toBe(HealthStatus.Unhealthy)

    await act(async () => polledCheck.resolve(healthyCheck))

    expect(databaseStatus(result)).toBe(HealthStatus.Unhealthy)
  })

  test("should still show an older result when the newer check failed", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const { result } = renderHook(() => useHealthCheck())
    await flush()

    const polledCheck = deferredHealthCheck()
    vi.mocked(performHealthCheck)
      .mockReturnValueOnce(polledCheck.promise)
      .mockRejectedValueOnce(new Error("health check failed"))

    await act(() => vi.advanceTimersByTimeAsync(HEALTH_CHECK_POLL_INTERVAL_MS))
    await act(() => result.current.refresh())
    expect(databaseStatus(result)).toBe(HealthStatus.Healthy)

    await act(async () => polledCheck.resolve(unhealthyCheck))

    expect(databaseStatus(result)).toBe(HealthStatus.Unhealthy)
    consoleError.mockRestore()
  })

  test("should show results in order when overlapping checks settle in order", async () => {
    const { result } = renderHook(() => useHealthCheck())
    await flush()

    const first = deferredHealthCheck()
    const second = deferredHealthCheck()
    vi.mocked(performHealthCheck)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    await act(() => vi.advanceTimersByTimeAsync(HEALTH_CHECK_POLL_INTERVAL_MS))
    let refreshed: Promise<void> = Promise.resolve()
    act(() => { refreshed = result.current.refresh() })

    await act(async () => first.resolve(unhealthyCheck))
    expect(databaseStatus(result)).toBe(HealthStatus.Unhealthy)

    await act(async () => {
      second.resolve(healthyCheck)
      await refreshed
    })
    expect(databaseStatus(result)).toBe(HealthStatus.Healthy)
  })
})
