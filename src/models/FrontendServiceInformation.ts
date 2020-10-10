import { Moment } from "moment"
import { Maybe } from "monet"

export interface FrontendServiceInformation {
  readonly name: string
  readonly version: string
  readonly timestamp: Moment
  readonly gitCommit: Maybe<string>
  readonly gitBranch: Maybe<string>
  readonly buildTimestamp: Maybe<Moment>
}
