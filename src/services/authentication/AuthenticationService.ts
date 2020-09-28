import {axiosClient} from "http/HttpClient";
import {AuthenticationToken} from "models/AuthenticationToken";
import {parseAuthenticationToken} from "utils/ResponseParser";

export const login = (password: string): Promise<AuthenticationToken> =>
    axiosClient.post("/authenticate/login", { password })
        .then(({data}) => parseAuthenticationToken(data))

export const logout = (): Promise<AuthenticationToken> =>
    axiosClient.delete("authentication/logout").then(({data}) => parseAuthenticationToken(data))
