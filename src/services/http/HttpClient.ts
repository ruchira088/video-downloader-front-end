import axios, { AxiosInstance } from "axios"
import { configuration } from "services/Configuration"
import { removeAuthenticationToken } from "../authentication/AuthenticationService"

export const CANCEL = "cancel"

export const axiosClient: AxiosInstance = axios.create({
  baseURL: configuration.apiService,
  withCredentials: true,
})

axiosClient.interceptors.response.use(
  (value) => Promise.resolve(value),
  (error) => {
    if (error.response?.status === 401) {
      removeAuthenticationToken()

      window.location.reload()
    } else if (error.message !== CANCEL && !window.location.pathname.endsWith("server-error")) {
      window.location.replace("/server-error")
    }

    return Promise.reject(error)
  }
)
