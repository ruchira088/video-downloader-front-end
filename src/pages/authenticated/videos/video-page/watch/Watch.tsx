import React, { useEffect, useRef, useState } from "react"
import { Duration } from "moment"
import { Maybe } from "monet"
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core"
import ApplicationContext from "context/ApplicationContext"
import Video from "models/Video"
import { imageUrl, videoUrl } from "services/asset/AssetService"
import { Snapshot } from "models/Snapshot"
import translate from "services/translation/TranslationService"
import VideoSnapshots from "components/video/video-snapshots/VideoSnapshots"
import EditableLabel from "components/editable-label/EditableLabel"
import { deleteVideo, updateVideoTitle } from "services/video/VideoService"
import VideoMetadataCard from "components/video/video-metadata-card/VideoMetadataCard"
import VideoMetadata from "models/VideoMetadata"
import { humanReadableSize, shortHumanReadableDuration } from "utils/Formatter"

import styles from "./Watch.module.scss"

const VideoDeleteDialog = (props: {
  isVisible: boolean
  onClose: () => void
  videoMetadata: VideoMetadata
  onDelete: (deleteFile: boolean) => Promise<void>
}) => {
  const [deleteFile, setDeleteFile] = useState<boolean>(false)

  return (
    <Dialog open={props.isVisible} onClose={props.onClose}>
      <DialogTitle>Delete Video?</DialogTitle>
      <DialogContent>
        <VideoMetadataCard {...props.videoMetadata} />
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

const VideoLink = (props: { videoMetadata: VideoMetadata }) => {
  if (props.videoMetadata.videoSite === "local") {
    return <span>{props.videoMetadata.videoSite.toUpperCase()}</span>
  } else {
    return <a href={props.videoMetadata.url} target="_blank">{props.videoMetadata.videoSite}</a>
  }
}

const MetadataField = (props: {label: string, value: string | React.ReactNode}) =>
  <div>
    <span className={styles.metadataLabel}>{props.label}:</span>
    <span className={styles.metadataValue}>{props.value}</span>
  </div>

const Metadata = (props: { videoMetadata: VideoMetadata }) => (
  <div className={styles.videoMetadata}>
    <MetadataField label="Size" value={humanReadableSize(props.videoMetadata.size)}/>
    <MetadataField label="Duration" value={shortHumanReadableDuration(props.videoMetadata.duration)}/>
    <MetadataField label="Source" value={<VideoLink videoMetadata={props.videoMetadata}/>}/>
  </div>
)

const Watch = (
  video: Video & { snapshots: Snapshot[] } & {
    timestamp: Duration
    updateVideo: (video: Video) => void
  }
) => {
  const videoPlayer = useRef<HTMLVideoElement>(null)
  const [isDeleteDialogVisible, setDeleteDialogVisibility] = useState<boolean>(false)

  useEffect(() => {
    Maybe.fromNull(videoPlayer.current).forEach((videoElement) => {
      videoElement.currentTime = video.timestamp.asSeconds()
    })
  }, [video.timestamp.asSeconds()])

  const onUpdateVideoTitle: (title: string) => Promise<void> = (title) =>
    updateVideoTitle(video.videoMetadata.id, title).then(video.updateVideo)

  const onDeleteVideo = (deleteFile: boolean): Promise<void> =>
    deleteVideo(video.videoMetadata.id, deleteFile).then(() => setDeleteDialogVisibility(false))

  return (
    <ApplicationContext.Consumer>
      {({ safeMode }) => (
        <div className={styles.watch}>
          <div className={styles.title}>
            <EditableLabel
              textValue={translate(video.videoMetadata.title, safeMode)}
              onUpdateText={onUpdateVideoTitle}
            />
          </div>
          <Metadata videoMetadata={video.videoMetadata} />
          <video
            ref={videoPlayer}
            controls
            preload="auto"
            poster={imageUrl(video.videoMetadata.thumbnail, safeMode)}
            className={styles.video}
          >
            <source src={videoUrl(video.fileResource)} />
          </video>
          <VideoSnapshots snapshots={video.snapshots} />
          <Button color="secondary" variant="contained" onClick={() => setDeleteDialogVisibility(true)}>
            Delete
          </Button>
          <VideoDeleteDialog
            isVisible={isDeleteDialogVisible}
            onClose={() => setDeleteDialogVisibility(false)}
            videoMetadata={video.videoMetadata}
            onDelete={onDeleteVideo}
          />
        </div>
      )}
    </ApplicationContext.Consumer>
  )
}

export default Watch
