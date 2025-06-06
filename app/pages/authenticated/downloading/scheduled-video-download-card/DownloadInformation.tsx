import React, {type FC} from "react"
import {Duration} from "luxon"
import {humanReadableDuration, humanReadableSize} from "~/utils/Formatter"
import type {DownloadableScheduledVideo} from "~/models/DownloadableScheduledVideo"

type DownloadInformationProps = {
  readonly downloadableScheduledVideo: DownloadableScheduledVideo
}

const DownloadInformation: FC<DownloadInformationProps> = ({downloadableScheduledVideo}) =>
  downloadableScheduledVideo.downloadSpeed
    .filter(speed => speed > 0)
    .map((speed: number) => (
      <div>
        <div>{humanReadableSize(speed, true, " ")}/s</div>
        <div>
          {
            remainingDuration(
              downloadableScheduledVideo.videoMetadata.size,
              downloadableScheduledVideo.downloadedBytes,
              speed
            )
          }
        </div>
      </div>
    ))
    .toNullable()

const remainingDuration = (totalSize: number, currentSize: number, downloadRate: number): string =>
  humanReadableDuration(Duration.fromObject({ seconds: Math.round((totalSize - currentSize) / downloadRate) }))

export default DownloadInformation
