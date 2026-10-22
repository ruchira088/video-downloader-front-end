import { useCallback, useEffect, useRef, useState } from "react"
import { DateTime } from "luxon"
import { performHealthCheck } from "~/services/health/HealthCheckService"
import { HealthCheck } from "~/models/HealthCheck"
import { None, type Option, Some } from "~/types/Option"
import { reportError } from "~/services/ErrorReporting"

export type HealthCheckDetails = { readonly timestamp: DateTime } & HealthCheck

export const HEALTH_CHECK_POLL_INTERVAL_MS = 30_000

export type UseHealthCheckResult = {
  /** The most recent health check shown, stamped with when it arrived; None until the first succeeds. */
  readonly healthCheckDetails: Option<HealthCheckDetails>
  /** True while a refresh started via `refresh` is in flight (polls do not set it). */
  readonly isRefreshing: boolean
  /** Runs a health check now. Never rejects: a failure is logged and the last result stays. */
  readonly refresh: () => Promise<void>
}

/**
 * Runs a health check on mount and every 30 seconds, plus on demand via `refresh`.
 */
export const useHealthCheck = (): UseHealthCheckResult => {
  const [healthCheckDetails, setHealthCheckDetails] = useState<Option<HealthCheckDetails>>(None.of())
  const [isRefreshing, setRefreshing] = useState<boolean>(false)
  const latestHealthCheckRequest = useRef(0)
  const shownHealthCheckRequest = useRef(0)

  // Absorbs its own failure: it runs from a poll and a button as well as on mount, and a failed
  // check should leave the last good result on screen rather than reject unhandled.
  const fetchHealthCheckDetails = useCallback(async () => {
    // The poll and the refresh button can overlap. A result older than the one on screen is
    // dropped, but one whose newer successor failed still counts.
    const healthCheckRequest = ++latestHealthCheckRequest.current

    try {
      const healthCheck = await performHealthCheck()

      if (healthCheckRequest < shownHealthCheckRequest.current) {
        return
      }

      shownHealthCheckRequest.current = healthCheckRequest

      setHealthCheckDetails(Some.of({
        ...healthCheck,
        timestamp: DateTime.now()
      }))
    } catch (error) {
      reportError("Failed to perform the health check", error)
    }
  }, [])

  useEffect(() => {
    // The setState happens after an await, so this is an async poll rather than a cascading render.
    // oxlint-disable-next-line react/set-state-in-effect
    void fetchHealthCheckDetails()
    const intervalId = setInterval(fetchHealthCheckDetails, HEALTH_CHECK_POLL_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [fetchHealthCheckDetails])

  const refresh = useCallback(async () => {
    setRefreshing(true)

    try {
      await fetchHealthCheckDetails()
    } finally {
      setRefreshing(false)
    }
  }, [fetchHealthCheckDetails])

  return { healthCheckDetails, isRefreshing, refresh }
}
