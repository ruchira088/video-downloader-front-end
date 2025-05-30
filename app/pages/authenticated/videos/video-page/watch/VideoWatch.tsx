import React, {type FC, useContext, useEffect, useRef, useState} from "react"
import {Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material"
import {ApplicationContext} from "~/context/ApplicationContext"
import {Video} from "~/models/Video"
import {imageUrl, videoUrl} from "~/services/asset/AssetService"
import {Snapshot} from "~/models/Snapshot"
import translate from "~/services/translation/TranslationService"
import VideoSnapshotsGallery from "~/components/video/video-snapshots/VideoSnapshotsGallery"
import EditableLabel from "~/components/editable-label/EditableLabel"
import {deleteVideo, updateVideoTitle} from "~/services/video/VideoService"
import VideoMetadataCard from "~/components/video/video-metadata-card/VideoMetadataCard"
import {VideoMetadata} from "~/models/VideoMetadata"
import {humanReadableSize, shortHumanReadableDuration} from "~/utils/Formatter"

import styles from "./VideoWatch.module.scss"
import {Duration} from "luxon"
import {Option} from "~/types/Option"

type VideDeleteDialogProps = {
  readonly isVisible: boolean
  readonly onClose: () => void
  readonly videoMetadata: VideoMetadata
  readonly onDelete: (deleteFile: boolean) => Promise<void>
}

const VideoDeleteDialog: FC<VideDeleteDialogProps> = props => {
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
  readonly label: string
  readonly value: React.ReactNode
}

const MetadataField: FC<MetadataFieldProps> = props =>
  <div>
    <span className={styles.metadataLabel}>{props.label}:</span>
    <span className={styles.metadataValue}>{props.value}</span>
  </div>

type MetadataProps = {
  readonly videoMetadata: VideoMetadata
}

const Metadata: FC<MetadataProps> = props => (
  <div className={styles.videoMetadata}>
    <MetadataField label="Size" value={humanReadableSize(props.videoMetadata.size)}/>
    <MetadataField label="Duration"
                   value={shortHumanReadableDuration(props.videoMetadata.duration)} />
    <MetadataField label="Source" value={<VideoLink videoMetadata={props.videoMetadata}/>}/>
  </div>
)

type VideoWatchProps = {
  readonly video: Video
  readonly timestamp: Duration
  readonly updateVideo: (video: Video) => void
  readonly snapshots: Snapshot[]
}

const VideoWatch: FC<VideoWatchProps> = props => {
  const videoPlayer = useRef<HTMLVideoElement>(null)
  const [isDeleteDialogVisible, setDeleteDialogVisibility] = useState<boolean>(false)
  const { safeMode } = useContext(ApplicationContext)

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

  return (
    <div className={styles.watch}>
      <div className={styles.title}>
        <EditableLabel
          textValue={translate(props.video.videoMetadata.title, safeMode)}
          onUpdateText={onUpdateVideoTitle}
        />
      </div>
      <Metadata videoMetadata={props.video.videoMetadata} />
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
