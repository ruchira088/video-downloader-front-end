import { axiosClient } from "services/http/HttpClient"
import { AuthenticationToken } from "models/AuthenticationToken"
import { parseAuthenticationToken } from "utils/ResponseParser"
import { KeySpace, LocalKeyValueStore } from "services/kv-store/KeyValueStore"
import { Maybe } from "monet"

export enum AuthenticationKey {
  Token = "Token",
}

const AuthenticationKeySpace: KeySpace<AuthenticationKey, AuthenticationToken> = {
  name: "Authentication",

  keyCodec: {
    decode(value: string): AuthenticationKey {
      return value as AuthenticationKey
    },

    encode(authenticationKey: AuthenticationKey): string {
      return authenticationKey.toString()
    },
  },

  valueCodec: {
    decode(value: string): AuthenticationToken {
      return parseAuthenticationToken(JSON.parse(value))
    },

    encode(authenticationToken: AuthenticationToken): string {
      return JSON.stringify(authenticationToken)
    },
  },
}

const authenticationKeyValueStore = new LocalKeyValueStore(AuthenticationKeySpace)

export const getAuthenticationToken = (): Maybe<AuthenticationToken> =>
  authenticationKeyValueStore.get(AuthenticationKey.Token)

export const login = (email: string, password: string): Promise<AuthenticationToken> =>
  axiosClient.post("/authentication/login", { email, password }).then(({ data }) => {
    authenticationKeyValueStore.put(AuthenticationKey.Token, data)

    return parseAuthenticationToken(data)
  })

export const logout = (): Promise<AuthenticationToken> =>
  axiosClient.delete("authentication/logout").then(({ data }) => {
    removeAuthenticationToken()

    return parseAuthenticationToken(data)
  })

export const removeAuthenticationToken = (): Maybe<AuthenticationToken> =>
  authenticationKeyValueStore.remove(AuthenticationKey.Token)
