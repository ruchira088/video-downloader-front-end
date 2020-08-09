import axios, {AxiosInstance} from "axios"
import ApiServiceInformation from "services/models/ApiServiceInformation";
import configuration from "services/Configuration";
import moment from "moment";
import {Maybe} from "monet";

const axiosClient: AxiosInstance = axios.create({baseURL: configuration.apiService})

export const apiServiceInformation: () => Promise<ApiServiceInformation> =
    () => axiosClient.get("/service/info")
        .then(({data}) => ({
            ...data,
            currentTimestamp: moment(data.currentTimestamp),
            buildTimestamp: Maybe.fromNull(data.buildTimestamp).map(moment),
            gitCommit: Maybe.fromNull(data.gitCommit),
            gitBranch: Maybe.fromNull(data.gitBranch)
        }))
