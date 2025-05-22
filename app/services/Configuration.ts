import { type KeySpace, LocalKeyValueStore } from "./kv-store/KeyValueStore"

enum ConfigurationKey {
  SafeMode = "SafeMode",
}

const API_URL_QUERY_PARAMETER = "API_URL"

const ConfigurationKeySpace: KeySpace<ConfigurationKey, boolean> = {
  name: "Configuration",

  keyCodec: {
    decode(value: string): ConfigurationKey {
      return value as ConfigurationKey
    },

    encode(configurationKey: ConfigurationKey): string {
      return configurationKey.toString()
    },
  },

  valueCodec: {
    decode(value: string): boolean {
      return value === "true"
    },

    encode(value: boolean): string {
      return value.toString()
    },
  },
}

const configurationKeyStore = new LocalKeyValueStore(ConfigurationKeySpace)

const savedSafeMode = configurationKeyStore.get(ConfigurationKey.SafeMode)

const apiBaseUrl = (): string => {
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
    } else {
      const apiUrl = `${location.protocol}//api.${location.host}`
      return apiUrl
    }
  }
}

export const setSavedSafeMode = (safeMode: boolean) => configurationKeyStore.put(ConfigurationKey.SafeMode, safeMode)

export interface Configuration {
  readonly apiService: string
  readonly safeMode: boolean
}

export const configuration: Configuration = {
  apiService: apiBaseUrl(),
  safeMode: savedSafeMode.getOrElse(() => false),
}
