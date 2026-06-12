import { useEffect } from "react"
import { useNavigate } from "react-router"
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
 */
export const useRedirectOnAuth = (redirectWhenAuthenticated: boolean): void => {
  const navigate = useNavigate()

  useEffect(() => {
    const maybeToken = getAuthenticationToken()

    if (redirectWhenAuthenticated) {
      maybeToken.forEach(async () => {
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

      maybeToken.fold(
        () => {
          console.debug("Redirecting to sign-in page.")
          navigate(redirectUrl)
        },
        async () => {
          try {
            await getAuthenticatedUser()
          } catch {
            removeAuthenticationToken()
            console.debug("Removing authentication token and redirecting to sign-in page.")
            navigate(redirectUrl)
          }
        }
      )
    }
  }, [])
}
