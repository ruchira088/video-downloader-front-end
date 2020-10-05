import { axiosClient } from "services/http/HttpClient";
import { AuthenticationToken } from "models/AuthenticationToken";
import { parseAuthenticationToken } from "utils/ResponseParser";
import { KeySpace, LocalStorage } from "../kv-store/KeyValueStore";
import { Maybe } from "monet";

enum AuthenticationKey {
  Token = "Token",
}

const authenticationKeyValueStore = new LocalStorage(KeySpace.Authentication);

export const isAuthenticated = (): Maybe<AuthenticationToken> =>
  authenticationKeyValueStore
    .get(AuthenticationKey.Token)
    .map((string) => parseAuthenticationToken(JSON.parse(string)));

export const login = (password: string): Promise<AuthenticationToken> =>
  axiosClient.post("/authentication/login", { password }).then(({ data }) => {
    authenticationKeyValueStore.put(
      AuthenticationKey.Token,
      JSON.stringify(data)
    );

    return parseAuthenticationToken(data);
  });

export const logout = (): Promise<AuthenticationToken> =>
  axiosClient.delete("authentication/logout").then(({ data }) => {
    authenticationKeyValueStore.remove(AuthenticationKey.Token);

    return parseAuthenticationToken(data);
  });
