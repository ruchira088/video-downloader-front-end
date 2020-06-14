import FileResource from "./FileResource";
import {Duration} from "moment";

export interface Snapshot {
    videoId: string
    fileResource: FileResource
    videoTimestamp: Duration
}
