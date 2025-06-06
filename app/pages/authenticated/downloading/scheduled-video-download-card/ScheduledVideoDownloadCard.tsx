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
import classNames from "classnames"

enum ModalDialogType {
  Delete = "Delete",
  Error = "Error"
}

type ScheduledVideoDownloadCardProps = {
  readonly downloadableScheduledVideo: DownloadableScheduledVideo
  readonly onDelete: () => Promise<void>
  readonly onUpdateStatus: (schedulingStatus: SchedulingStatus) => Promise<void>
}

const ScheduledVideoDownloadCard: FC<ScheduledVideoDownloadCardProps> = props => {
  const [dialogVisibility, setDialogVisibility] = useState<Option<ModalDialogType>>(None.of())

  const isVisible = (modalDialogType: ModalDialogType) =>
    !dialogVisibility.filter(dialogType => dialogType === modalDialogType).isEmpty()

  return (
    <div className={styles.card}>
      <VideoMetadataCard
        videoMetadata={props.downloadableScheduledVideo.videoMetadata}
        classNames={styles.videoMetadata}
        enableSourceLink={true}
        disableSnapshots={true}>
        <div
          className={styles.deleteButton}
          onClick={() => setDialogVisibility(Some.of(ModalDialogType.Delete))}
        >
          X
        </div>
      </VideoMetadataCard>
      <div>
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
        onClose={() => setDialogVisibility(None.of())}
        onDelete={props.onDelete}
      />
      <ErrorDetailsDialog
        scheduleVideoDownload={props.downloadableScheduledVideo}
        isVisible={isVisible(ModalDialogType.Error)}
        onClose={() => setDialogVisibility(None.of())}
        onUpdateStatus={props.onUpdateStatus}
        onDelete={props.onDelete}/>
    </div>
  )
}

type ErrorDetailsDialogProps = {
  readonly scheduleVideoDownload: ScheduledVideoDownload
  readonly isVisible: boolean
  readonly onClose: () => void
  readonly onUpdateStatus: (schedulingStatus: SchedulingStatus) => Promise<void>
  readonly onDelete: () => void
}

const ErrorDetailsDialog: FC<ErrorDetailsDialogProps> = props => (
  <Dialog open={props.isVisible} onClose={props.onClose}>
    <DialogTitle>Error Details</DialogTitle>
    <DialogContent>
      {props.scheduleVideoDownload.errorInfo?.message}
    </DialogContent>
    <DialogActions>
      <Button onClick={() => props.onUpdateStatus(SchedulingStatus.Queued).finally(props.onClose)}>Retry</Button>
      <Button onClick={props.onClose}>Cancel</Button>
    </DialogActions>
  </Dialog>
)

type ScheduledVideoDeleteDialogProps = {
  readonly isVisible: boolean
  readonly onClose: () => void
  readonly onDelete: () => Promise<void>
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
        onClick={() => props.onDelete().finally(props.onClose)}
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
  readonly onUpdateStatus: (schedulingStatus: SchedulingStatus) => Promise<void>
}

const Actions: FC<ActionsProps> = props => {
  const {status} = props.scheduleVideoDownload

  return (
    <div className={styles.actions}>
      <div className={styles.actionButtons}>
      {
        Option.fromNullable(TRANSITION_STATES[status])
          .getOrElse(() => [] as SchedulingStatus[])
          .map((next: SchedulingStatus, index: number) => (
            getActionName(status, next).fold(
              () => null,
              actionName =>
                <Button
                  key={index}
                  variant="contained"
                  className={styles.actionButton}
                  onClick={() => props.onUpdateStatus(next)}
                >
                  {actionName}
                </Button>
              )
            )
          )
      }
      </div>
      <div className={styles.statusInfo}>
        <div className={styles.status}>{status}</div>
        {status === SchedulingStatus.Error &&
          <div
            onClick={props.onClickErrorDetails}
            className={classNames(styles.errorDetails)}>
            Error Details
          </div>
        }
      </div>
    </div>
  )
}

export default ScheduledVideoDownloadCard
