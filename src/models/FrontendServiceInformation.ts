import {Moment} from "moment";

export interface FrontendServiceInformation {
    name: string
    version: string
    gitCommit: string
    gitBranch: string
    timestamp: Moment
    buildTimestamp: Moment
}
