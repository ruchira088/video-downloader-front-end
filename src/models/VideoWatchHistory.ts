import { Duration, Moment } from "moment"
import Video from "./Video"

export type VideoWatchHistory  = {
  readonly id: string
  readonly duration: Duration
  readonly userId: string
  readonly createdAt: Moment
  readonly lastUpdatedAt: Moment
  readonly video: Video
}