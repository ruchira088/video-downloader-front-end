import FileResource from "./FileResource"
import { Duration } from "moment"

export default interface VideoMetadata {
  readonly url: string
  readonly id: string
  readonly videoSite: string
  readonly title: string
  readonly duration: Duration
  readonly size: number
  readonly thumbnail: FileResource
}
