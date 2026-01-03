const API_URL_QUERY_PARAMETER = "API_URL"

const API_URL_MAPPINGS: Record<string, string> = {
  "staging.videos.ruchij.com": "api.staging.video.dev.ruchij.com",
  "videos.ruchij.com": "api.video.home.ruchij.com",
  "staging.video.dev.ruchij.com": "api.staging.video.dev.ruchij.com",
  "video.home.ruchij.com": "api.video.home.ruchij.com"
}

const inferBaseApiUrl = (): string => {
  const location = window.location
  const queryParams: URLSearchParams = new URLSearchParams(location.search)
  const apiUrlViaQueryParams = queryParams.get(API_URL_QUERY_PARAMETER)

  if (apiUrlViaQueryParams) {
    const url = new URL(location.href)
    url.searchParams.delete(API_URL_QUERY_PARAMETER)
    window.history.replaceState({}, "", url.toString())

    return apiUrlViaQueryParams
  } else {
    const apiUrlViaEnv = import.meta.env.VITE_API_URL

    if (apiUrlViaEnv) {
      return apiUrlViaEnv
    } else if (location.host in API_URL_MAPPINGS) {
      return `${location.protocol}//${API_URL_MAPPINGS[location.host]}`
    } else {
      const apiUrl = `${location.protocol}//api.${location.host}`
      return apiUrl
    }
  }
}

export interface ApiConfiguration {
  readonly baseUrl: string
}

export const configuration: ApiConfiguration = {
  baseUrl: inferBaseApiUrl(),
}
