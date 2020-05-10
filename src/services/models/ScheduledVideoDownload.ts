import VideoMetadata from "./VideoMetadata";

export default interface ScheduledVideoDownload {
    scheduledAt: string
    lastUpdatedAt: string
    videoMetadata: VideoMetadata
    downloadedBytes: number
    completedAt: string
}
