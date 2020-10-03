import axios, {AxiosInstance} from "axios";
import {configuration} from "services/Configuration";

export const axiosClient: AxiosInstance = axios.create({baseURL: configuration.apiService, withCredentials: true})
