import { axiosClient } from "services/http/HttpClient"
import { AuthenticationToken } from "models/AuthenticationToken"
import { parseAuthenticationToken } from "utils/ResponseParser"
import { KeySpace, LocalKeyValueStore } from "services/kv-store/KeyValueStore"
import { Maybe } from "monet"

export enum AuthenticationKey {
  Token = "Token",
}

const authenticationKeyValueStore = new LocalKeyValueStore(KeySpace.Authentication)

export const isAuthenticated = (): Maybe<AuthenticationToken> =>
  authenticationKeyValueStore.get(AuthenticationKey.Token).map((string) => parseAuthenticationToken(JSON.parse(string)))

export const login = (password: string): Promise<AuthenticationToken> =>
  axiosClient.post("/authentication/login", { password }).then(({ data }) => {
    authenticationKeyValueStore.put(AuthenticationKey.Token, JSON.stringify(data))

    return parseAuthenticationToken(data)
  })

export const logout = (): Promise<AuthenticationToken> =>
  axiosClient.delete("authentication/logout").then(({ data }) => {
    authenticationKeyValueStore.remove(AuthenticationKey.Token)

    return parseAuthenticationToken(data)
  })
