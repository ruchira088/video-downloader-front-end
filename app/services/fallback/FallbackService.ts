import axios, { type AxiosInstance } from "axios"
import { Environment, getEnvironment } from "~/services/Config"
import { None, Option, Some } from "~/types/Option"

// The fallback API serves users while the main API is down. It can only create a user's account by
// checking their credentials against the main API, so every main-API login enrols the user there in
// advance, and keeps their name, role and password up to date.
const FALLBACK_API_URL_MAPPINGS: Record<Environment.Branch | Environment.Staging | Environment.Production, string> = {
  [Environment.Staging]: "https://staging.fallback-api.video.ruchij.com",
  [Environment.Branch]: "https://staging.fallback-api.video.ruchij.com",
  [Environment.Production]: "https://fallback-api.video.ruchij.com",
}

// Local development has no fallback unless VITE_FALLBACK_API_URL points at one
const inferFallbackApiUrl = (): Option<string> =>
  Option.fromNullable<string>(import.meta.env.VITE_FALLBACK_API_URL)
    .filter((url) => url.length > 0)
    .orElse(() => {
      const environment = getEnvironment()

      return environment in FALLBACK_API_URL_MAPPINGS
        ? Some.of(FALLBACK_API_URL_MAPPINGS[environment as keyof typeof FALLBACK_API_URL_MAPPINGS])
        : None.of<string>()
    })

// Its own client rather than the shared one: the fallback authenticates with bearer tokens, not the
// main API's cookies, and a 401 from it must not trigger the shared client's sign-out.
const fallbackClient: Option<AxiosInstance> = inferFallbackApiUrl().map((baseURL) =>
  axios.create({ baseURL, timeout: 15_000 })
)

/**
 * Creates the user's fallback account, or refreshes it, with the credentials the main API has just
 * accepted. Never fails: the fallback being unreachable must not affect signing in.
 */
export const enrolInFallback = async (email: string, password: string): Promise<void> => {
  await fallbackClient.forEach(async (client) => {
    try {
      await client.post("/user", { email, password })
    } catch (error) {
      console.debug("Unable to enrol the user in the fallback API", error)
    }
  })
}
