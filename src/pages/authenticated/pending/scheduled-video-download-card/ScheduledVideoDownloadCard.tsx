import React, { useState } from "react"
import ScheduledVideoDownload from "models/ScheduledVideoDownload"
import ProgressBar from "pages/authenticated/pending/download-progress-bar/DownloadProgressBar"
import styles from "./ScheduledVideoDownloadCard.module.css"
import { Downloadable } from "../ScheduledVideos"
import DownloadInformation from "./DownloadInformation"
import { updateSchedulingStatus } from "services/scheduling/SchedulingService"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core"
import { COMMAND_NAMES, SchedulingStatus, TRANSITION_STATES } from "models/SchedulingStatus"
import { Maybe } from "monet"
import VideoMetadataCard from "components/video/video-metadata-card/VideoMetadataCard"
import VideoMetadata from "models/VideoMetadata"

export default (props: {
  scheduledVideoDownload: ScheduledVideoDownload & Downloadable
  onDelete: (videoId: string) => Promise<void>
}) => {
  const [deleteDialogVisibility, setDeleteDialogVisibility] = useState<boolean>(false)

  return (
    <div className={styles.card}>
      <Button onClick={() => setDeleteDialogVisibility(!deleteDialogVisibility)}>Delete</Button>
      <VideoMetadataCard {...props.scheduledVideoDownload.videoMetadata} disableSnapshots={true} />
      {props.scheduledVideoDownload.videoMetadata.size > props.scheduledVideoDownload.downloadedBytes && (
        <div>
          <ProgressBar
            completeValue={props.scheduledVideoDownload.videoMetadata.size}
            currentValue={props.scheduledVideoDownload.downloadedBytes}
          />
          <DownloadInformation {...props.scheduledVideoDownload} />
          <Actions {...props.scheduledVideoDownload} />
        </div>
      )}
      <ScheduledVideoDeleteDialog
        videoMetadata={props.scheduledVideoDownload.videoMetadata}
        visible={deleteDialogVisibility}
        onClose={() => setDeleteDialogVisibility(false)}
        onDelete={props.onDelete}
      />
    </div>
  )
}

const ScheduledVideoDeleteDialog = (props: {
  visible: boolean
  onClose: () => void
  onDelete: (videoId: string) => Promise<void>
  videoMetadata: VideoMetadata
}) => (
  <Dialog open={props.visible} onClose={props.onClose}>
    <DialogTitle>Delete Scheduled Video?</DialogTitle>
    <DialogContent>
      <VideoMetadataCard {...props.videoMetadata} disableSnapshots={true} />
    </DialogContent>
    <DialogActions>
      <Button variant="contained" onClick={props.onClose}>
        Cancel
      </Button>
      <Button
        color="secondary"
        variant="contained"
        onClick={() => {
          props.onDelete(props.videoMetadata.id).finally(props.onClose)
        }}
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
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
