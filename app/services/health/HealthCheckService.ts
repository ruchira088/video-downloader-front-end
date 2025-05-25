import { BackendServiceInformation } from "~/models/BackendServiceInformation"
import { axiosClient } from "~/services/http/HttpClient"
import packageInfo from "../../../package.json"
import type { FrontendServiceInformation } from "~/models/FrontendServiceInformation"
import { DateTime } from "luxon"
import { Option } from "~/types/Option"
import { zodParse } from "~/types/Zod"

export const backendServiceInformation: () => Promise<BackendServiceInformation> = async () => {
  const response = await axiosClient.get("/service/info")
  const serviceInformation = zodParse(BackendServiceInformation, response.data)

  return serviceInformation
}

export const frontendServiceInformation = (env: ImportMetaEnv): FrontendServiceInformation => ({
  name: packageInfo.name,
  version: packageInfo.version,
  timestamp: DateTime.now(),
  buildTimestamp: Option.fromNullable(env.VITE_BUILD_TIMESTAMP).map(DateTime.fromISO),
  gitBranch: Option.fromNullable(env.VITE_GIT_BRANCH),
  gitCommit: Option.fromNullable(env.VITE_GIT_COMMIT)
})
