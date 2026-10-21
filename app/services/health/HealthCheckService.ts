import {BackendServiceInformation} from "~/models/BackendServiceInformation"
import {axiosClient} from "~/services/http/HttpClient"
import packageInfo from "../../../package.json"
import type {FrontendServiceInformation} from "~/models/FrontendServiceInformation"
import {DateTime} from "luxon"
import {Option} from "~/types/Option"
import {zodParse} from "~/types/Zod"
import {HealthCheck} from "~/models/HealthCheck"

export const retrieveBackendServiceInformation = async (): Promise<BackendServiceInformation> => {
  const response = await axiosClient.get("/service/info")
  return zodParse(BackendServiceInformation, response.data)
}

export const performHealthCheck = async (): Promise<HealthCheck> => {
  // An unhealthy service answers 5xx with a health report, so accept any status but 401:
  // that must reject so the shared client's interceptor signs out the expired session.
  const response = await axiosClient.get("/service/health", { validateStatus: (status) => status !== 401 })
  return zodParse(HealthCheck, response.data)
}

// .env writes unset values as empty strings.
const nonEmpty = (value: string | undefined): Option<string> =>
  Option.fromNullable(value).filter((text) => text.length > 0)

export const frontendServiceInformation = (env: ImportMetaEnv): FrontendServiceInformation => ({
  name: packageInfo.name,
  version: packageInfo.version,
  timestamp: DateTime.now(),
  buildTimestamp: nonEmpty(env.VITE_BUILD_TIMESTAMP).map((timestamp) => DateTime.fromISO(timestamp)),
  gitBranch: nonEmpty(env.VITE_GIT_BRANCH),
  gitCommit: nonEmpty(env.VITE_GIT_COMMIT)
})
