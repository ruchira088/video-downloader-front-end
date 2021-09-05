import { Duration } from "moment"

export interface VideoServiceSummary {
  videoCount: number
  totalSize: number
  totalDuration: Duration
  sites: string[]
}
