import VideoMetadata from "./VideoMetadata";
import {Moment} from "moment";

export default interface ScheduledVideoDownload {
    scheduledAt: string
    lastUpdatedAt: string
    videoMetadata: VideoMetadata
    downloadedBytes: number
    completedAt: string
}
