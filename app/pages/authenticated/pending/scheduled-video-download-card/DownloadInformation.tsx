import React from "react"
import { type ScheduledVideoDownload } from "~/models/ScheduledVideoDownload"
import type { BytesPerSecond, Downloadable } from "../ScheduledVideos"
import { humanReadableDuration, humanReadableSize } from "~/utils/Formatter"
import { Duration } from "luxon"

const DownloadInformation = (scheduledVideoDownload: ScheduledVideoDownload & Downloadable) =>
  scheduledVideoDownload.downloadSpeed
    .map((speed: number) => (
      <div>
        <div>{humanReadableSize(speed, true)}</div>
        <div>
          {
            remainingDuration(
              scheduledVideoDownload.videoMetadata.size,
              scheduledVideoDownload.downloadedBytes,
              speed
            )
          }
        </div>
      </div>
    ))
    .toNullable()

const remainingDuration = (totalSize: number, currentSize: number, downloadRate: BytesPerSecond): string =>
  humanReadableDuration(Duration.fromObject({ seconds: (totalSize - currentSize) / downloadRate }))

export default DownloadInformation
