import type { DateTime } from "luxon"
import type { Option } from "~/types/Option"

export type FrontendServiceInformation = {
  readonly name: string,
  readonly version: string,
  readonly timestamp: DateTime,
  readonly gitCommit: Option<string>,
  readonly gitBranch: Option<string>,
  readonly buildTimestamp: Option<DateTime>,
}