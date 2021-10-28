import React, { useState } from "react"
import ScheduledVideoDownload from "models/ScheduledVideoDownload"
import ProgressBar from "pages/authenticated/pending/download-progress-bar/DownloadProgressBar"
import styles from "./ScheduledVideoDownloadCard.module.css"
import { Downloadable } from "../ScheduledVideos"
import DownloadInformation from "./DownloadInformation"
import { updateSchedulingStatus } from "services/scheduling/SchedulingService"
import { Button } from "@material-ui/core"
import { COMMAND_NAMES, SchedulingStatus, TRANSITION_STATES } from "models/SchedulingStatus"
import { Maybe } from "monet"
import VideoMetadataCard from "components/video/video-metadata-card/VideoMetadataCard"

export default (scheduledVideoDownload: ScheduledVideoDownload & Downloadable) => (
  <div className={styles.card}>
    <VideoMetadataCard {...scheduledVideoDownload.videoMetadata} disableSnapshots={true} />
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
)

const Actions = (scheduleVideoDownload: ScheduledVideoDownload) => {
  const [status, setStatus] = useState(scheduleVideoDownload.status)

  return (
    <div>
      {Maybe.fromNull(TRANSITION_STATES[status] as SchedulingStatus[])
        .getOrElse([])
        .map((next, index) => (
          <Button
            key={index}
            onClick={() =>
              updateSchedulingStatus(scheduleVideoDownload.videoMetadata.id, next).then((value) =>
                setStatus(value.status)
              )
            }
          >
            {Maybe.fromNull(COMMAND_NAMES[next]).getOrElse(next)}
          </Button>
        ))}
    </div>
  )
}
