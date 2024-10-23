import VideoMetadata from "./VideoMetadata"
import FileResource from "./FileResource"
import { Duration } from "moment"

export default interface Video {
  readonly videoMetadata: VideoMetadata
  readonly fileResource: FileResource
  readonly watchTime: Duration
}
