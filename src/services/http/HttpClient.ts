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
      removeAuthenticationToken().forEach(() => {
        window.location.reload()
      })
    } else {
      return Promise.reject(error)
    }
  }
)
