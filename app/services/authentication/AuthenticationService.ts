import { axiosClient } from "~/services/http/HttpClient"
import { AuthenticationToken, StoredAuthenticationToken } from "~/models/AuthenticationToken"
import { type KeySpace, LocalKeyValueStore } from "~/services/kv-store/KeyValueStore"
import { User } from "~/models/User"
import type { Option } from "~/types/Option"
import { zodParse } from "~/types/Zod"

const AuthenticationKey = "Token" as const

const AuthenticationKeySpace: KeySpace<typeof AuthenticationKey, StoredAuthenticationToken> = {
  name: "Authentication",

  keyEncoder: {
    encode(authenticationKey: typeof AuthenticationKey): string {
      return authenticationKey.toString()
    },
  },

  valueCodec: {
    decode(value: string): StoredAuthenticationToken {
      // Lenient on purpose: older stored entries include a `secret`, which Zod strips here.
      return zodParse(StoredAuthenticationToken, JSON.parse(value))
    },

    encode(storedAuthenticationToken: StoredAuthenticationToken): string {
      return JSON.stringify(storedAuthenticationToken)
    },
  },
}

const authenticationKeyValueStore = new LocalKeyValueStore(AuthenticationKeySpace)

export const REDIRECT_QUERY_PARAMETER = "redirect"

export const getAuthenticationToken = (): Option<StoredAuthenticationToken> =>
  authenticationKeyValueStore.get(AuthenticationKey)

export const login = async (email: string, password: string): Promise<AuthenticationToken> => {
  const response = await axiosClient.post("/authentication/login", { email, password })
  const authenticationToken = zodParse(AuthenticationToken, response.data)

  // Never persist the secret: authentication uses cookies, so the stored token is only
  // a "logged in" marker and the secret would be gratuitous XSS-stealable material.
  const { secret: _secret, ...storedAuthenticationToken } = authenticationToken
  authenticationKeyValueStore.put(AuthenticationKey, storedAuthenticationToken)

  return authenticationToken
}

export const getAuthenticatedUser = async (): Promise<User> => {
  const response = await axiosClient.get("/authentication/user")
  const user = zodParse(User, response.data)

  return user
}

export const logout = async (): Promise<User> => {
  const response = await axiosClient.delete("authentication/logout")
  removeAuthenticationToken()

  const user = zodParse(User, response.data)

  return user
}

export const removeAuthenticationToken = (): Option<StoredAuthenticationToken> =>
  authenticationKeyValueStore.remove(AuthenticationKey)
