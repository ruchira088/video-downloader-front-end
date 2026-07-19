import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { DateTime } from "luxon"
import {
  getAuthenticatedUser,
  getAuthenticationToken,
  REDIRECT_QUERY_PARAMETER,
  removeAuthenticationToken
} from "~/services/authentication/AuthenticationService"

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
 * Returns whether the session has been verified with the server. Protected layouts
 * must not render children until this is true, otherwise child pages fire API calls
 * before the session check completes. Always true for public layouts.
 */
export const useRedirectOnAuth = (redirectWhenAuthenticated: boolean): boolean => {
  const navigate = useNavigate()
  const [isVerified, setIsVerified] = useState(redirectWhenAuthenticated)

  useEffect(() => {
    const maybeToken = getAuthenticationToken()
    const maybeUnexpiredToken = maybeToken.filter((token) => token.expiresAt > DateTime.now())

    if (!maybeToken.isEmpty() && maybeUnexpiredToken.isEmpty()) {
      console.debug("Stored authentication token has expired. Removing authentication token.")
      removeAuthenticationToken()
    }

    if (redirectWhenAuthenticated) {
      maybeUnexpiredToken.forEach(async () => {
        try {
          await getAuthenticatedUser()
          navigate("/")
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
          navigate(redirectUrl)
        },
        async () => {
          try {
            await getAuthenticatedUser()
            setIsVerified(true)
          } catch {
            removeAuthenticationToken()
            console.debug("Removing authentication token and redirecting to sign-in page.")
            navigate(redirectUrl)
          }
        }
      )
    }
  }, [])

  return isVerified
}
