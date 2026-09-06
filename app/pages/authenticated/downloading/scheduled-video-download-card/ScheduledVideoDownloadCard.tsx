import React, {type FC, useState} from "react"
import {ScheduledVideoDownload} from "~/models/ScheduledVideoDownload"
import DownloadProgress from "~/pages/authenticated/downloading/download-progress-bar/DownloadProgress"
import DownloadInformation from "./DownloadInformation"
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material"
import {None, Option, Some} from "~/types/Option"
import {getActionName, SchedulingStatus, TRANSITION_STATES} from "~/models/SchedulingStatus"
import VideoMetadataCard from "~/components/video/video-metadata-card/VideoMetadataCard"
import {VideoMetadata} from "~/models/VideoMetadata"
import type {DownloadableScheduledVideo} from "~/models/DownloadableScheduledVideo"
import styles from "./ScheduledVideoDownloadCard.module.scss"
import Timestamp from "~/components/timestamp/Timestamp"

enum ModalDialogType {
  Delete = "Delete",
  Error = "Error"
}

type ScheduledVideoDownloadCardProps = {
  readonly downloadableScheduledVideo: DownloadableScheduledVideo
  readonly onDelete: () => Promise<unknown>
  readonly onUpdateStatus: (schedulingStatus: SchedulingStatus) => Promise<unknown>
}

const ScheduledVideoDownloadCard: FC<ScheduledVideoDownloadCardProps> = props => {
  const [dialogVisibility, setDialogVisibility] = useState<Option<ModalDialogType>>(None.of())

  const isVisible = (modalDialogType: ModalDialogType) => dialogVisibility.toNullable() === modalDialogType

  const closeDialog = () => setDialogVisibility(None.of())

  return (
    <div className={styles.card}>
      <VideoMetadataCard
        videoMetadata={props.downloadableScheduledVideo.videoMetadata}
        classNames={styles.videoMetadata}
        enableSourceLink={true}
        disableSnapshots={true}>
        <button
          type="button"
          aria-label="Delete scheduled video"
          className={styles.deleteButton}
          onClick={() => setDialogVisibility(Some.of(ModalDialogType.Delete))}
        >
          X
        </button>
      </VideoMetadataCard>
      <Timestamp timestamp={props.downloadableScheduledVideo.scheduledAt} className={styles.scheduledTimestamp}/>
      <div className={styles.downloadSection}>
        <DownloadProgress
          completeValue={props.downloadableScheduledVideo.videoMetadata.size}
          currentValue={props.downloadableScheduledVideo.downloadedBytes}
          schedulingStatus={props.downloadableScheduledVideo.status}
        />
        <DownloadInformation downloadableScheduledVideo={props.downloadableScheduledVideo}/>
        <Actions
          scheduleVideoDownload={props.downloadableScheduledVideo}
          onUpdateStatus={props.onUpdateStatus}
          onClickErrorDetails={() => setDialogVisibility(Some.of(ModalDialogType.Error))}/>
      </div>
      <ScheduledVideoDeleteDialog
        videoMetadata={props.downloadableScheduledVideo.videoMetadata}
        isVisible={isVisible(ModalDialogType.Delete)}
        onClose={closeDialog}
        onDelete={props.onDelete}
      />
      <ErrorDetailsDialog
        scheduleVideoDownload={props.downloadableScheduledVideo}
        isVisible={isVisible(ModalDialogType.Error)}
        onClose={closeDialog}
        onUpdateStatus={props.onUpdateStatus}/>
    </div>
  )
}

type ErrorDetailsDialogProps = {
  readonly scheduleVideoDownload: ScheduledVideoDownload
  readonly isVisible: boolean
  readonly onClose: () => void
  readonly onUpdateStatus: (schedulingStatus: SchedulingStatus) => Promise<unknown>
}

const ErrorDetailsDialog: FC<ErrorDetailsDialogProps> = props => (
  <Dialog open={props.isVisible} onClose={props.onClose}>
    <DialogTitle>Error Details</DialogTitle>
    <DialogContent>
      {props.scheduleVideoDownload.errorInfo.map(errorInfo => errorInfo.message).toNullable()}
    </DialogContent>
    <DialogActions>
      <Button onClick={() => props.onUpdateStatus(SchedulingStatus.Queued).catch(console.error).finally(props.onClose)}>Retry</Button>
      <Button onClick={props.onClose}>Cancel</Button>
    </DialogActions>
  </Dialog>
)

type ScheduledVideoDeleteDialogProps = {
  readonly isVisible: boolean
  readonly onClose: () => void
  readonly onDelete: () => Promise<unknown>
  readonly videoMetadata: VideoMetadata
}

const ScheduledVideoDeleteDialog: FC<ScheduledVideoDeleteDialogProps> = props => (
  <Dialog open={props.isVisible} onClose={props.onClose}>
    <DialogTitle>Delete Scheduled Video?</DialogTitle>
    <DialogContent>
      <VideoMetadataCard videoMetadata={props.videoMetadata} disableSnapshots={true} />
    </DialogContent>
    <DialogActions>
      <Button
        color="secondary"
        variant="contained"
        onClick={() => props.onDelete().catch(console.error).finally(props.onClose)}
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
  readonly onClickErrorDetails: () => void
  readonly onUpdateStatus: (schedulingStatus: SchedulingStatus) => Promise<unknown>
}

const Actions: FC<ActionsProps> = props => {
  const {status} = props.scheduleVideoDownload

  return (
    <div className={styles.actions}>
      <div className={styles.actionButtons}>
      {
        (TRANSITION_STATES[status] ?? []).map((next) =>
          getActionName(status, next)
            .map(actionName =>
              <Button
                key={next}
                variant="contained"
                className={styles.actionButton}
                onClick={() => props.onUpdateStatus(next)}
              >
                {actionName}
              </Button>
            )
            .toNullable()
        )
      }
      </div>
      <div className={styles.statusInfo}>
        <div className={styles.status}>{status}</div>
        {status === SchedulingStatus.Error &&
          <button
            type="button"
            onClick={props.onClickErrorDetails}
            className={styles.errorDetails}>
            Error Details
          </button>
        }
      </div>
    </div>
  )
}

export default ScheduledVideoDownloadCard
