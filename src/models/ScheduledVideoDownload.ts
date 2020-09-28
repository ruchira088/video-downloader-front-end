import VideoMetadata from "./VideoMetadata";
import {Moment} from "moment";
import {Maybe} from "monet";

export default interface ScheduledVideoDownload {
    readonly scheduledAt: Moment
    readonly videoMetadata: VideoMetadata
    readonly downloadedBytes: number
    readonly completedAt: Maybe<Moment>
}
