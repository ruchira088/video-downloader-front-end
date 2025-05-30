import axios, { type AxiosInstance } from "axios"
import { configuration } from "~/services/Configuration"
import { removeAuthenticationToken } from "../authentication/AuthenticationService"

export const axiosClient: AxiosInstance = axios.create({
  baseURL: configuration.apiService,
  withCredentials: true,
})

axiosClient.interceptors.response.use(
  (value) => Promise.resolve(value),
  (error) => {
    if (error.response?.status === 401) {
      console.debug("Received 401 status response. Removing authentication token and redirecting to sign-in page.")
      removeAuthenticationToken()
    } else {
      return Promise.reject(error)
    }
  }
)
