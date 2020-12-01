import axios, { AxiosInstance } from "axios"
import { configuration } from "services/Configuration"
import { KeySpace, LocalKeyValueStore } from "../kv-store/KeyValueStore"
import { AuthenticationKey } from "../authentication/AuthenticationService"

export const axiosClient: AxiosInstance = axios.create({
  baseURL: configuration.apiService,
  withCredentials: true,
})

axiosClient.interceptors.response.use(
  (value) => Promise.resolve(value),
  (error) => {
    if (error.response?.status === 401) {
      const keyValueStore = new LocalKeyValueStore(KeySpace.Authentication)
      keyValueStore.remove(AuthenticationKey.Token)

      window.location.reload()
    } else {
        // TODO Handle errors
    }

    return Promise.reject(error)
  }
)
