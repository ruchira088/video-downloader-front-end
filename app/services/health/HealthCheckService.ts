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
  const backendServiceInformation = zodParse(BackendServiceInformation, response.data)

  return backendServiceInformation
}

export const performHealthCheck = async (): Promise<HealthCheck> => {
  const response = await axiosClient.get("/service/health", { validateStatus: () => true })
  const healthCheck: HealthCheck = zodParse(HealthCheck, response.data)

  return healthCheck
}

export const frontendServiceInformation = (env: ImportMetaEnv): FrontendServiceInformation => ({
  name: packageInfo.name,
  version: packageInfo.version,
  timestamp: DateTime.now(),
  buildTimestamp: Option.fromNullable(env.VITE_BUILD_TIMESTAMP).map(DateTime.fromISO),
  gitBranch: Option.fromNullable(env.VITE_GIT_BRANCH),
  gitCommit: Option.fromNullable(env.VITE_GIT_COMMIT)
})
