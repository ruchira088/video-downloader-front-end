import { axiosClient } from "~/services/http/HttpClient"
import { AuthenticationToken } from "~/models/AuthenticationToken"
import { type KeySpace, LocalKeyValueStore } from "~/services/kv-store/KeyValueStore"
import { User } from "~/models/User"
import type { Option } from "~/types/Option"

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
      return AuthenticationToken.parse(JSON.parse(value))
    },

    encode(authenticationToken: AuthenticationToken): string {
      return JSON.stringify(authenticationToken)
    },
  },
}

const authenticationKeyValueStore = new LocalKeyValueStore(AuthenticationKeySpace)

export const REDIRECT_QUERY_PARAMETER = "redirect"

export const getAuthenticationToken = (): Option<AuthenticationToken> =>
  authenticationKeyValueStore.get(AuthenticationKey.Token)

export const login = async (email: string, password: string): Promise<AuthenticationToken> => {
  const response = await axiosClient.post("/authentication/login", { email, password })
  const authenticationToken = AuthenticationToken.parse(response.data)

  authenticationKeyValueStore.put(AuthenticationKey.Token, authenticationToken)

  return authenticationToken
}

export const getAuthenticatedUser = async (): Promise<User> => {
  const response = await axiosClient.get("/authentication/user")
  const user = User.parse(response.data)

  return user
}

export const logout = async (): Promise<AuthenticationToken> => {
  const response = await axiosClient.delete("authentication/logout")
  const authenticationToken = AuthenticationToken.parse(response.data)
  removeAuthenticationToken()

  return authenticationToken
}

export const removeAuthenticationToken = (): Option<AuthenticationToken> =>
  authenticationKeyValueStore.remove(AuthenticationKey.Token)
