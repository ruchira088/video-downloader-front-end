import React, {type FC, useState} from "react"
import {ScheduledVideoDownload} from "~/models/ScheduledVideoDownload"
import ProgressBar from "~/pages/authenticated/downloading/download-progress-bar/DownloadProgressBar"
import styles from "./ScheduledVideoDownloadCard.module.scss"
import DownloadInformation from "./DownloadInformation"
import {updateSchedulingStatus} from "~/services/scheduling/SchedulingService"
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material"
import {Option} from "~/types/Option"
import {COMMAND_NAMES, SchedulingStatus, TRANSITION_STATES} from "~/models/SchedulingStatus"
import VideoMetadataCard from "~/components/video/video-metadata-card/VideoMetadataCard"
import {VideoMetadata} from "~/models/VideoMetadata"
import type {DownloadableScheduledVideo} from "~/models/DownloadableScheduledVideo"

type ScheduledVideoDownloadCardProps = {
  readonly downloadableScheduledVideo: DownloadableScheduledVideo
  readonly onDelete: (videoId: string) => Promise<void>
}

const ScheduledVideoDownloadCard: FC<ScheduledVideoDownloadCardProps> = props => {
  const [deleteDialogVisibility, setDeleteDialogVisibility] = useState<boolean>(false)

  return (
    <div className={styles.card}>
      <VideoMetadataCard
        videoMetadata={props.downloadableScheduledVideo.videoMetadata}
        classNames={styles.videoMetadata}
        enableSourceLink={true}
        disableSnapshots={true}>
        <div
          className={styles.deleteButton}
          onClick={() => setDeleteDialogVisibility(!deleteDialogVisibility)}
        >
          X
        </div>
      </VideoMetadataCard>
      {props.downloadableScheduledVideo.videoMetadata.size > props.downloadableScheduledVideo.downloadedBytes && (
        <div>
          <ProgressBar
            completeValue={props.downloadableScheduledVideo.videoMetadata.size}
            currentValue={props.downloadableScheduledVideo.downloadedBytes}
          />
          <DownloadInformation downloadableScheduledVideo={props.downloadableScheduledVideo}/>
          <Actions scheduleVideoDownload={props.downloadableScheduledVideo}/>
        </div>
      )}
      <ScheduledVideoDeleteDialog
        videoMetadata={props.downloadableScheduledVideo.videoMetadata}
        visible={deleteDialogVisibility}
        onClose={() => setDeleteDialogVisibility(false)}
        onDelete={props.onDelete}
      />
    </div>
  )
}

type ScheduledVideoDeleteDialogProps = {
  readonly visible: boolean
  readonly onClose: () => void
  readonly onDelete: (videoId: string) => Promise<void>
  readonly videoMetadata: VideoMetadata
}

const ScheduledVideoDeleteDialog: FC<ScheduledVideoDeleteDialogProps> = props => (
  <Dialog open={props.visible} onClose={props.onClose}>
    <DialogTitle>Delete Scheduled Video?</DialogTitle>
    <DialogContent>
      <VideoMetadataCard videoMetadata={props.videoMetadata} disableSnapshots={true} />
    </DialogContent>
    <DialogActions>
      <Button
        color="secondary"
        variant="contained"
        onClick={() => {
          props.onDelete(props.videoMetadata.id).finally(props.onClose)
        }}
      >
        Delete
      </Button>
      <Button variant="contained" onClick={props.onClose}>
        Cancel
      </Button>
    </DialogActions>
  </Dialog>
)

type ActionsProps = {
  readonly scheduleVideoDownload: ScheduledVideoDownload
}

const Actions: FC<ActionsProps> = ({scheduleVideoDownload}) => {
  const [status, setStatus] = useState(scheduleVideoDownload.status)

  return (
    <div>
      {
        Option.fromNullable(TRANSITION_STATES[status])
          .getOrElse(() => [] as SchedulingStatus[])
          .map((next: SchedulingStatus, index: number) => (
          <Button
            key={index}
            onClick={() =>
              updateSchedulingStatus(scheduleVideoDownload.videoMetadata.id, next).then((value) =>
                setStatus(value.status)
              )
            }
          >
            {Option.fromNullable(COMMAND_NAMES[next]).getOrElse(() => next)}
          </Button>
        ))}
    </div>
  )
}

export default ScheduledVideoDownloadCard
