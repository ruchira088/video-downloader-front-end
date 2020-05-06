import axios, {AxiosInstance} from "axios"
import moment from "moment";
import ApiServiceInformation from "../models/ApiServiceInformation";
import configuration from "../Configuration";

const axiosClient: AxiosInstance = axios.create({ baseURL: configuration.apiService })

export const apiServiceInformation:  () => Promise<ApiServiceInformation> =
    () =>
        axiosClient.get("/service")
            .then(({data}) => ({...data, timestamp: moment(data.timestamp)}))
