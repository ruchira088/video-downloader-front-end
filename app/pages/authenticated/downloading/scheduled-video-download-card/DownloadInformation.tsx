import React, {type FC} from "react"
import {Duration} from "luxon"
import {humanReadableDuration, humanReadableSize} from "~/utils/Formatter"
import type {DownloadableScheduledVideo} from "~/models/DownloadableScheduledVideo"
import {None, type Option, Some} from "~/types/Option"

type DownloadInformationProps = {
  readonly downloadableScheduledVideo: DownloadableScheduledVideo
}

const DownloadInformation: FC<DownloadInformationProps> = ({downloadableScheduledVideo}) =>
  downloadableScheduledVideo.downloadSpeed
    .filter(speed => speed > 0)
    .map((speed: number) => (
      <div>
        <div>{humanReadableSize(speed, true, " ")}/s</div>
        {
          // An unknown (0) or underestimated size would otherwise read as "0 seconds" remaining.
          remainingDuration(
            downloadableScheduledVideo.videoMetadata.size,
            downloadableScheduledVideo.downloadedBytes,
            speed
          )
            .map(remaining => <div>{remaining}</div>)
            .toNullable()
        }
      </div>
    ))
    .toNullable()

const remainingDuration = (totalSize: number, currentSize: number, downloadRate: number): Option<string> =>
  totalSize > currentSize
    ? Some.of(humanReadableDuration(Duration.fromObject({ seconds: Math.round((totalSize - currentSize) / downloadRate) })))
    : None.of()

export default DownloadInformation
