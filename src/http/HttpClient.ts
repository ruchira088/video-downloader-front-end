import axios, {AxiosInstance} from "axios";
import {CONFIGURATION} from "services/Configuration";

export const axiosClient: AxiosInstance = axios.create({baseURL: CONFIGURATION.apiService, withCredentials: true})
