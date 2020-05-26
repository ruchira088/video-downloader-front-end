import VideoMetadata from "./VideoMetadata";
import {Moment} from "moment";
import {Maybe} from "monet";

export default interface ScheduledVideoDownload {
    scheduledAt: Moment
    lastUpdatedAt: Moment
    videoMetadata: VideoMetadata
    downloadedBytes: number
    completedAt: Maybe<Moment>
}
