import React, { useState } from "react"
import ApplicationContext from "context/ApplicationContext"
import ScheduledVideoDownload from "models/ScheduledVideoDownload"
import { imageUrl } from "services/asset/AssetService"
import translate from "services/translation/TranslationService"
import ProgressBar from "pages/authenticated/pending/download-progress-bar/DownloadProgressBar"
import { humanReadableDuration, humanReadableSize } from "utils/Formatter"
import styles from "./ScheduledVideoDownloadCard.module.css"
import { Downloadable } from "../ScheduledVideos"
import DownloadInformation from "./DownloadInformation"
import { updateSchedulingStatus } from "services/scheduling/SchedulingService"
import { Button } from "@material-ui/core"
import { COMMAND_NAMES, SchedulingStatus, TRANSITION_STATES } from "models/SchedulingStatus"
import { Maybe } from "monet"

export default (scheduledVideoDownload: ScheduledVideoDownload & Downloadable) => (
  <ApplicationContext.Consumer>
    {({ safeMode }) => (
      <div className={styles.card}>
        <img alt="thumbnail" src={imageUrl(scheduledVideoDownload.videoMetadata.thumbnail.id, safeMode)} />
        <div>{translate(scheduledVideoDownload.videoMetadata.title, safeMode)}</div>
        <div>{humanReadableDuration(scheduledVideoDownload.videoMetadata.duration)}</div>
        <div>{humanReadableSize(scheduledVideoDownload.videoMetadata.size)}</div>
        {scheduledVideoDownload.videoMetadata.size > scheduledVideoDownload.downloadedBytes && (
          <div>
            <ProgressBar
              completeValue={scheduledVideoDownload.videoMetadata.size}
              currentValue={scheduledVideoDownload.downloadedBytes}
            />
            <DownloadInformation {...scheduledVideoDownload} />
            <Actions {...scheduledVideoDownload} />
          </div>
        )}
      </div>
    )}
  </ApplicationContext.Consumer>
)

const Actions = (scheduleVideoDownload: ScheduledVideoDownload) => {
  const [status, setStatus] = useState(scheduleVideoDownload.status)

  return (
    <div>
      {(TRANSITION_STATES[status] as SchedulingStatus[]).map((next, index) => (
        <Button
          key={index}
          onClick={() =>
            updateSchedulingStatus(scheduleVideoDownload.videoMetadata.id, next).then((value) => setStatus(value.status))
          }
        >
          {Maybe.fromNull(COMMAND_NAMES[next]).getOrElse(next)}
        </Button>
      ))}
    </div>
  )
}
