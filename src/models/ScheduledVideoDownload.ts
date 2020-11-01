import VideoMetadata from "./VideoMetadata"
import { Moment } from "moment"
import { Maybe } from "monet"
import { SchedulingStatus } from "./SchedulingStatus"

export default interface ScheduledVideoDownload {
  readonly scheduledAt: Moment
  readonly videoMetadata: VideoMetadata
  readonly status: SchedulingStatus
  readonly downloadedBytes: number
  readonly completedAt: Maybe<Moment>
}
