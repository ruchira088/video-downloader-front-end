import { Moment } from "moment"
import { Maybe } from "monet"

export interface FrontendServiceInformation {
  name: string
  version: string
  timestamp: Moment
  gitCommit: Maybe<string>
  gitBranch: Maybe<string>
  buildTimestamp: Maybe<Moment>
}
