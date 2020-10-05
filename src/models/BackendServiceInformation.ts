import { Maybe } from "monet"
import { Moment } from "moment"

export default interface BackendServiceInformation {
  readonly serviceName: string
  readonly serviceVersion: string
  readonly organization: string
  readonly scalaVersion: string
  readonly sbtVersion: string
  readonly javaVersion: string
  readonly currentTimestamp: Moment
  readonly gitBranch: Maybe<string>
  readonly gitCommit: Maybe<string>
  readonly buildTimestamp: Maybe<Moment>
}
