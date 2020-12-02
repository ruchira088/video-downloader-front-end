import { Maybe } from "monet"
import { KeySpace, LocalKeyValueStore } from "./kv-store/KeyValueStore"

enum ConfigurationKey {
  SafeMode = "SafeMode",
}

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

export const setSavedSafeMode = (safeMode: boolean) => configurationKeyStore.put(ConfigurationKey.SafeMode, safeMode)

export interface Configuration {
  readonly apiService: string
  readonly safeMode: boolean
}

export const configuration: Configuration = {
  apiService: Maybe.fromFalsy(process.env.REACT_APP_API_URL).orLazy(() => `https://api.${window.location.hostname}`),
  safeMode: savedSafeMode.getOrElse(false),
}
