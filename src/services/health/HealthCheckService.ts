import ApiServiceInformation from "models/ApiServiceInformation";
import moment from "moment";
import {Maybe} from "monet";
import {axiosClient} from "http/HttpClient";

export const apiServiceInformation: () => Promise<ApiServiceInformation> =
    () => axiosClient.get("/service/info")
        .then(({data}) => ({
            ...data,
            currentTimestamp: moment(data.currentTimestamp),
            buildTimestamp: Maybe.fromNull(data.buildTimestamp).map(moment),
            gitCommit: Maybe.fromNull(data.gitCommit),
            gitBranch: Maybe.fromNull(data.gitBranch)
        }))
