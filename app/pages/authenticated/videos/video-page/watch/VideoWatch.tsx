import React, { type FC, useEffect, useRef, useState } from "react"
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material"
import { Video } from "~/models/Video"
import { imageUrl, videoUrl } from "~/services/asset/AssetService"
import { Snapshot } from "~/models/Snapshot"
import VideoSnapshotsGallery from "~/components/video/video-snapshots/VideoSnapshotsGallery"
import Helmet from "~/components/helmet/Helmet"
import EditableLabel from "~/components/editable-label/EditableLabel"
import { deleteVideo, updateVideoTitle } from "~/services/video/VideoService"
import VideoMetadataCard from "~/components/video/video-metadata-card/VideoMetadataCard"
import Timestamp from "~/components/timestamp/Timestamp"
import { VideoMetadata } from "~/models/VideoMetadata"
import { humanReadableSize, shortHumanReadableDuration } from "~/utils/Formatter"

import styles from "./VideoWatch.module.scss"
import { Duration } from "luxon"
import { Option } from "~/types/Option"
import { translate } from "~/services/sanitize/SanitizationService"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"

type VideoDeleteDialogProps = {
  readonly isVisible: boolean
  readonly onClose: () => void
  readonly videoMetadata: VideoMetadata
  readonly onDelete: (deleteFile: boolean) => Promise<void>
}

const VideoDeleteDialog: FC<VideoDeleteDialogProps> = props => {
  const [deleteFile, setDeleteFile] = useState<boolean>(false)

  return (
    <Dialog open={props.isVisible} onClose={props.onClose}>
      <DialogTitle>Delete Video?</DialogTitle>
      <DialogContent>
        <VideoMetadataCard videoMetadata={props.videoMetadata} />
        <div>
          Delete video file <Checkbox value={deleteFile} onChange={(event) => setDeleteFile(event.target.checked)} />
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          color="secondary"
          variant="contained"
          onClick={() => props.onDelete(deleteFile).then(() => setDeleteFile(false))}
        >
          Delete
        </Button>
        <Button onClick={props.onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  )
}

type VideoLinkProps = {
  readonly videoMetadata: VideoMetadata
}

const VideoLink: FC<VideoLinkProps> = props => {
  if (props.videoMetadata.videoSite === "local") {
    return <span>{props.videoMetadata.videoSite.toUpperCase()}</span>
  } else {
    return <a href={props.videoMetadata.url} target="_blank">{props.videoMetadata.videoSite}</a>
  }
}

type MetadataFieldProps = {
  readonly label?: string
  readonly value: React.ReactNode
  readonly className?: string
}

const MetadataField: FC<MetadataFieldProps> = props =>
  <div>
    {props.label && <span className={styles.metadataLabel}>{props.label}:</span>}
    <span className={props.className}>{props.value}</span>
  </div>

type MetadataProps = {
  readonly video: Video
}

const Metadata: FC<MetadataProps> = props => (
  <div className={styles.videoMetadata}>
    <MetadataField
      label="Size"
      value={humanReadableSize(props.video.videoMetadata.size)}
      className={styles.metadataValue}/>
    <MetadataField
      label="Duration"
      value={shortHumanReadableDuration(props.video.videoMetadata.duration)}
      className={styles.metadataValue}/>
    <MetadataField
      label="Source"
      value={<VideoLink videoMetadata={props.video.videoMetadata}/>}
      className={styles.metadataValue}
    />
    <Timestamp timestamp={props.video.createdAt}/>
  </div>
)

type VideoWatchProps = {
  readonly video: Video
  readonly timestamp: Duration
  readonly updateVideo: (video: Video) => void
  readonly snapshots: Snapshot[]
}

const VideoWatch: FC<VideoWatchProps> = props => {
  const videoPlayer = useRef<HTMLVideoElement | null>(null)
  const [isDeleteDialogVisible, setDeleteDialogVisibility] = useState<boolean>(false)
  const { safeMode } = useApplicationConfiguration()

  useEffect(() => {
    Option.fromNullable(videoPlayer.current)
      .forEach((videoElement: HTMLVideoElement) => {
        videoElement.currentTime = props.timestamp.as("seconds")
    })
  }, [props.timestamp.as("seconds")])

  const onUpdateVideoTitle = async (title: string): Promise<void> => {
    const video = await updateVideoTitle(props.video.videoMetadata.id, title)
    props.updateVideo(video)
  }

  const onDeleteVideo = async (deleteFile: boolean): Promise<void> => {
    await deleteVideo(props.video.videoMetadata.id, deleteFile)
    setDeleteDialogVisibility(false)
  }

  const title = translate(props.video.videoMetadata.title, safeMode)

  return (
    <div className={styles.videoWatch}>
      <div className={styles.title}>
        <Helmet title={title}/>
        <EditableLabel
          textValue={title}
          onUpdateText={onUpdateVideoTitle}
        />
      </div>
      <Metadata video={props.video}/>
      <video
        ref={videoPlayer}
        controls
        preload="auto"
        poster={imageUrl(props.video.videoMetadata.thumbnail, safeMode)}
        className={styles.video}
      >
        <source src={videoUrl(props.video.fileResource)} />
      </video>
      <VideoSnapshotsGallery snapshots={props.snapshots} />
      <Button color="secondary" variant="contained" onClick={() => setDeleteDialogVisibility(true)}>
        Delete
      </Button>
      <VideoDeleteDialog
        isVisible={isDeleteDialogVisible}
        onClose={() => setDeleteDialogVisibility(false)}
        videoMetadata={props.video.videoMetadata}
        onDelete={onDeleteVideo}
      />
    </div>
  )
}

export default VideoWatch
