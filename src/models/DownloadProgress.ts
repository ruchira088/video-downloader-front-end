import { Moment } from "moment"

export interface DownloadProgress {
  readonly videoId: string
  readonly updatedAt: Moment
  readonly bytes: number
}
