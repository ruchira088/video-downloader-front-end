import BackendServiceInformation from "models/BackendServiceInformation";
import moment from "moment";
import {Maybe} from "monet";
import {axiosClient} from "services/http/HttpClient";
import {name, version} from "../../../package.json"
import {gitCommit, gitBranch, buildTimestamp} from "services/health/build-info.json"
import {FrontendServiceInformation} from "models/FrontendServiceInformation";

export const backendServiceInformation: () => Promise<BackendServiceInformation> =
    () => axiosClient.get("/service/info")
        .then(({data}) => ({
            ...data,
            currentTimestamp: moment(data.currentTimestamp),
            buildTimestamp: Maybe.fromNull(data.buildTimestamp).map(moment),
            gitCommit: Maybe.fromNull(data.gitCommit),
            gitBranch: Maybe.fromNull(data.gitBranch)
        }))

export const frontendServiceInformation: FrontendServiceInformation = {
    name, version, gitCommit, gitBranch, timestamp: moment(), buildTimestamp: moment(buildTimestamp ?? undefined)
}
