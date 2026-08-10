import axios, { type AxiosInstance } from "axios"
import { apiConfiguration } from "~/services/ApiConfiguration"
import { removeAuthenticationToken } from "../authentication/AuthenticationService"
import { None, Option } from "~/types/Option"

/**
 * The HTTP status carried by a rejected request, when there is one. `None` covers both
 * non-HTTP failures (network, timeout, cancellation) and non-axios errors.
 */
export const httpStatusCode = (error: unknown): Option<number> =>
  axios.isAxiosError(error) ? Option.fromNullable(error.response?.status) : None.of()

declare module "axios" {
  export interface AxiosRequestConfig {
    // Callers with their own 401 handling (e.g. the session probe in useRedirectOnAuth)
    // set this to suppress the interceptor's hard redirect to the sign-in page.
    skipUnauthenticatedRedirect?: boolean
  }
}

export const axiosClient: AxiosInstance = axios.create({
  baseURL: apiConfiguration.baseUrl,
  withCredentials: true,
})

const UNAUTHENTICATED_PATHS = ["/sign-in", "/sign-up"]

const isOnUnauthenticatedPage = (): boolean =>
  UNAUTHENTICATED_PATHS.some((path) => window.location.pathname.startsWith(path))

axiosClient.interceptors.response.use(
  (value) => Promise.resolve(value),
  (error) => {
    if (error.response?.status === 401) {
      console.debug("Received 401 status response. Removing authentication token.")
      // Only Some when a token existed: of N concurrent 401s, only the first remover redirects.
      const removedToken = removeAuthenticationToken()

      if (
        error.config?.skipUnauthenticatedRedirect !== true &&
        !removedToken.isEmpty() &&
        !isOnUnauthenticatedPage()
      ) {
        window.location.assign(
          "/sign-in?redirect=" + encodeURIComponent(window.location.pathname + window.location.search)
        )
      }
    }
    return Promise.reject(error)
  }
)
