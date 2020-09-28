import FileResource from "./FileResource";
import {Duration} from "moment";

export interface Snapshot {
    readonly videoId: string
    readonly fileResource: FileResource
    readonly videoTimestamp: Duration
}
