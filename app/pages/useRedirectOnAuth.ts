import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { DateTime } from "luxon"
import {
  getAuthenticatedUser,
  getAuthenticationToken,
  REDIRECT_QUERY_PARAMETER,
  removeAuthenticationToken
} from "~/services/authentication/AuthenticationService"
import { httpStatusCode } from "~/services/http/HttpClient"
import { None, Option, Some } from "~/types/Option"
import type { User } from "~/models/User"
import { safeRedirectPath } from "~/pages/unauthenticated/AuthFormHelpers"

/**
 * - `Verifying`: the session check is in flight.
 * - `Verified`: the server confirmed the session.
 * - `Unreachable`: the check failed for a reason other than a 401 (network error, timeout,
 *   5xx), so whether the session is valid is unknown. The stored token is kept.
 */
export enum SessionStatus {
  Verifying = "Verifying",
  Verified = "Verified",
  Unreachable = "Unreachable",
}

export type SessionCheck = {
  readonly status: SessionStatus
  // The signed-in user once the protected layout's check succeeds; always None for public layouts.
  readonly user: Option<User>
  // Re-runs the session check, e.g. after the server was unreachable.
  readonly retry: () => void
}

/**
 * Shared authentication gate for layouts.
 *
 * When `redirectWhenAuthenticated` is true (public/unauthenticated layout), a valid
 * session redirects to the home page. When false (protected layout), a missing or
 * invalid session redirects to the sign-in page.
 *
 * A stored token whose `expiresAt` is in the past is treated as unauthenticated
 * immediately: it is removed without a server round-trip.
 *
 * Only a 401 counts as signed out in the protected layout. Any other failure reports
 * `Unreachable` and keeps the token, so a flaky connection doesn't sign the user out.
 *
 * Returns the session status. Protected layouts must not render children until it is
 * `Verified`, otherwise child pages fire API calls before the session check completes.
 * Always `Verified` for public layouts.
 */
export const useRedirectOnAuth = (redirectWhenAuthenticated: boolean): SessionCheck => {
  const navigate = useNavigate()
  const [status, setStatus] = useState(
    redirectWhenAuthenticated ? SessionStatus.Verified : SessionStatus.Verifying
  )
  const [user, setUser] = useState<Option<User>>(None.of())
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setStatus(SessionStatus.Verifying)
    setAttempt(previous => previous + 1)
  }, [])

  useEffect(() => {
    const maybeToken = getAuthenticationToken()
    const maybeUnexpiredToken = maybeToken.filter((token) => token.expiresAt > DateTime.now())

    if (!maybeToken.isEmpty() && maybeUnexpiredToken.isEmpty()) {
      console.debug("Stored authentication token has expired. Removing authentication token.")
      removeAuthenticationToken()
    }

    if (redirectWhenAuthenticated) {
      void maybeUnexpiredToken.forEach(async () => {
        try {
          await getAuthenticatedUser()
          // Honour ?redirect= the same way signing in would, e.g. a shared link opened while signed in.
          const redirect = Option.fromNullable(new URLSearchParams(window.location.search).get(REDIRECT_QUERY_PARAMETER))
          void navigate(safeRedirectPath(redirect))
        } catch {
          // User not authenticated, stay on the current public page.
        }
      })
    } else {
      const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search)
      const redirectUrl = `/sign-in?${REDIRECT_QUERY_PARAMETER}=${redirectTarget}`

      maybeUnexpiredToken.fold(
        () => {
          console.debug("Redirecting to sign-in page.")
          void navigate(redirectUrl)
        },
        async () => {
          try {
            const authenticatedUser = await getAuthenticatedUser()
            setUser(Some.of(authenticatedUser))
            setStatus(SessionStatus.Verified)
          } catch (error) {
            const isUnauthenticated = !httpStatusCode(error).filter(code => code === 401).isEmpty()

            if (isUnauthenticated) {
              removeAuthenticationToken()
              console.debug("Removing authentication token and redirecting to sign-in page.")
              void navigate(redirectUrl)
            } else {
              console.debug("Unable to verify the session with the server.", error)
              setStatus(SessionStatus.Unreachable)
            }
          }
        }
      )
    }
  }, [navigate, redirectWhenAuthenticated, attempt])

  return { status, user, retry }
}
