import BackendServiceInformation from "models/BackendServiceInformation"
import moment from "moment"
import { Maybe } from "monet"
import { axiosClient } from "services/http/HttpClient"
import { name, version } from "../../../package.json"
import { FrontendServiceInformation } from "models/FrontendServiceInformation"

export const backendServiceInformation: () => Promise<BackendServiceInformation> = () =>
  axiosClient.get("/service/info").then(({ data }) => ({
    ...data,
    currentTimestamp: moment(data.currentTimestamp),
    buildTimestamp: Maybe.fromNull(data.buildTimestamp).map(moment),
    gitCommit: Maybe.fromNull(data.gitCommit),
    gitBranch: Maybe.fromNull(data.gitBranch),
  }))

export const frontendServiceInformation: (env: any) => FrontendServiceInformation = (env) => ({
  name,
  version,
  timestamp: moment(),
  buildTimestamp: Maybe.fromFalsy(env.REACT_APP_BUILD_TIMESTAMP).map(moment),
  gitBranch: Maybe.fromFalsy(env.REACT_APP_GIT_BRANCH),
  gitCommit: Maybe.fromFalsy(env.REACT_APP_GIT_COMMIT),
})
