import {Maybe} from "monet";
import {Moment} from "moment";

export default interface ApiServiceInformation {
  serviceName: string
  serviceVersion: string
  organization: string
  scalaVersion: string
  sbtVersion: string
  javaVersion: string
  currentTimestamp: Moment
  gitBranch: Maybe<string>
  gitCommit: Maybe<string>
  buildTimestamp: Maybe<Moment>
}
