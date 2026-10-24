import * as Sentry from "@sentry/react"
import axios from "axios"

/**
 * Decides whether a handled failure is worth a Sentry event. Every failure is still logged
 * to the console; this only filters out the noise that would otherwise drown real bugs.
 */
export const shouldReport = (error: unknown): boolean => {
  // A request the app aborted itself (navigation, a newer search) is not a failure.
  if (axios.isCancel(error) || (error instanceof DOMException && error.name === "AbortError")) {
    return false
  }

  // An expired session is expected; the HTTP client already signs the user out on a 401.
  // Network errors stay reported: an unreachable API is exactly what Sentry should show.
  return !(axios.isAxiosError(error) && error.response?.status === 401)
}

/**
 * Reports a failure the app has handled (shown a message, fallen back, retried) and would
 * otherwise swallow. `operation` names what was being attempted and becomes a Sentry tag,
 * so events group by user action rather than by error text.
 *
 * Logs with `console.warn` rather than `console.error`: Sentry's console integration
 * captures error-level logs, which would report the same failure twice.
 */
export const reportError = (operation: string, error: unknown): void => {
  console.warn(operation, error)

  if (shouldReport(error)) {
    // notifyError may be called without an error; still give Sentry something with a stack.
    Sentry.captureException(error ?? new Error(operation), { tags: { operation } })
  }
}
