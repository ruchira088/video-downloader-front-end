import React, { type FC, useEffect, useRef, useState } from "react"
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip
} from "@mui/material"
import KeyboardIcon from "@mui/icons-material/Keyboard"
import CloseIcon from "@mui/icons-material/Close"
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
import { None, Option, Some } from "~/types/Option"
import { translate } from "~/services/sanitize/SanitizationService"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import { useNavigate } from "react-router"
import { useNotification } from "~/providers/NotificationProvider"
import { playbackPositionService } from "~/services/playback/PlaybackPositionService"
import { PLAYER_SHORTCUTS, usePlayerShortcuts } from "./usePlayerShortcuts"

type VideoDeleteDialogProps = {
  readonly isVisible: boolean
  readonly onClose: () => void
  readonly videoMetadata: VideoMetadata
  readonly onDelete: (deleteFile: boolean) => Promise<void>
}

const VideoDeleteDialog: FC<VideoDeleteDialogProps> = props => {
  const [deleteFile, setDeleteFile] = useState<boolean>(false)
  // Guards against a second click sending a second DELETE while the first is in flight.
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const { notifyError } = useNotification()

  const handleDelete = () => {
    setIsDeleting(true)
    props.onDelete(deleteFile)
      .then(() => setDeleteFile(false))
      .catch((error) => notifyError("Failed to delete the video", error))
      .finally(() => setIsDeleting(false))
  }

  return (
    <Dialog open={props.isVisible} onClose={isDeleting ? undefined : props.onClose}>
      <DialogTitle>Delete Video?</DialogTitle>
      <DialogContent>
        <VideoMetadataCard videoMetadata={props.videoMetadata} />
        <div>
          Delete video file <Checkbox checked={deleteFile} onChange={(event) => setDeleteFile(event.target.checked)} />
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          color="secondary"
          variant="contained"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
        <Button onClick={props.onClose} disabled={isDeleting}>Cancel</Button>
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
    return <a href={props.videoMetadata.url} target="_blank" rel="noopener noreferrer">{props.videoMetadata.videoSite}</a>
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

type Resolution = {
  readonly width: number
  readonly height: number
}

type MetadataProps = {
  readonly video: Video
  // Known only once the player has loaded the video's metadata.
  readonly resolution: Option<Resolution>
}

const formatResolution = (resolution: Option<Resolution>): React.ReactNode =>
  resolution.fold<React.ReactNode>(
    () => <CircularProgress size={16} aria-label="Loading resolution" />,
    ({ width, height }) => `${width}x${height}`
  )

const Metadata: FC<MetadataProps> = props => (
  <div className={styles.metadataRow}>
    <MetadataField
      label="Size"
      value={humanReadableSize(props.video.videoMetadata.size)}
      className={styles.metadataValue}/>
    <MetadataField
      label="Duration"
      value={shortHumanReadableDuration(props.video.videoMetadata.duration)}
      className={styles.metadataValue}/>
    <MetadataField
      label="Resolution"
      value={formatResolution(props.resolution)}
      className={styles.metadataValue}/>
    <MetadataField
      label="Source"
      value={<VideoLink videoMetadata={props.video.videoMetadata}/>}
      className={styles.metadataValue}
    />
  </div>
)

// How far playback moves before the position is saved again; saving on every timeupdate (~4/s) is wasteful.
const SAVE_INTERVAL_SECONDS = 5

const ShortcutsHelp: FC = () => (
  <Tooltip
    title={
      <dl className={styles.shortcuts}>
        {PLAYER_SHORTCUTS.map(shortcut => (
          <React.Fragment key={shortcut.keys}>
            <dt>{shortcut.keys}</dt>
            <dd>{shortcut.description}</dd>
          </React.Fragment>
        ))}
      </dl>
    }
  >
    <IconButton aria-label="Keyboard shortcuts">
      <KeyboardIcon />
    </IconButton>
  </Tooltip>
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
  const [resolution, setResolution] = useState<Option<Resolution>>(None.of())
  const { safeMode } = useApplicationConfiguration()
  const navigate = useNavigate()

  const timestampSeconds = props.timestamp.as("seconds")
  const videoId = props.video.videoMetadata.id

  // A link with an explicit ?timestamp= says where to start, so it isn't second-guessed.
  const [resumePosition, setResumePosition] = useState<Option<Duration>>(() =>
    timestampSeconds > 0 ? None.of() : playbackPositionService.savedPosition(videoId)
  )
  const lastSavedSeconds = useRef<number>(timestampSeconds)

  usePlayerShortcuts(videoPlayer)

  useEffect(() => {
    void Option.fromNullable(videoPlayer.current)
      .forEach((videoElement: HTMLVideoElement) => {
        videoElement.currentTime = timestampSeconds
    })
  }, [timestampSeconds])

  const handleLoadedMetadata = () => {
    void Option.fromNullable(videoPlayer.current)
      .forEach((videoElement: HTMLVideoElement) => {
        setResolution(Some.of({
          width: videoElement.videoWidth,
          height: videoElement.videoHeight
        }))
      })
  }

  const savePosition = (videoElement: HTMLVideoElement) => {
    lastSavedSeconds.current = videoElement.currentTime
    playbackPositionService.savePosition(
      videoId,
      Duration.fromObject({ seconds: videoElement.currentTime }),
      Number.isFinite(videoElement.duration)
        ? Duration.fromObject({ seconds: videoElement.duration })
        : props.video.videoMetadata.duration
    )
  }

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    if (Math.abs(event.currentTarget.currentTime - lastSavedSeconds.current) >= SAVE_INTERVAL_SECONDS) {
      savePosition(event.currentTarget)
    }
  }

  const handleEnded = () => {
    playbackPositionService.clearPosition(videoId)
    setResumePosition(None.of())
  }

  const resume = (position: Duration) => {
    void Option.fromNullable(videoPlayer.current)
      .forEach((videoElement: HTMLVideoElement) => {
        videoElement.currentTime = position.as("seconds")
      })
    setResumePosition(None.of())
  }

  const onUpdateVideoTitle = async (title: string): Promise<void> => {
    const video = await updateVideoTitle(props.video.videoMetadata.id, title)
    props.updateVideo(video)
  }

  const onDeleteVideo = async (deleteFile: boolean): Promise<void> => {
    await deleteVideo(props.video.videoMetadata.id, deleteFile)
    setDeleteDialogVisibility(false)
    void navigate("/")
  }

  const title = translate(props.video.videoMetadata.title, safeMode)

  return (
    <div className={styles.videoWatch}>
      <Helmet title={title}/>
      <div className={styles.infoSection}>
        <div className={styles.title}>
          <EditableLabel
            textValue={title}
            onUpdateText={onUpdateVideoTitle}
            // Safe mode shows a substitute title; editing it would save the substitute over the real one.
            readOnly={safeMode}
          />
        </div>
        <Timestamp timestamp={props.video.createdAt} className={styles.timestamp}/>
        <Metadata video={props.video} resolution={resolution}/>
      </div>
      {
        resumePosition.map(position =>
          <Alert
            severity="info"
            className={styles.resumePrompt}
            action={
              <>
                <Button color="inherit" size="small" onClick={() => resume(position)}>Resume</Button>
                <IconButton color="inherit" size="small" aria-label="Dismiss" onClick={() => setResumePosition(None.of())}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            }
          >
            You stopped at {shortHumanReadableDuration(position)}
          </Alert>
        ).toNullable()
      }
      <div className={styles.videoContainer}>
        <video
          ref={videoPlayer}
          controls
          preload="auto"
          poster={imageUrl(props.video.videoMetadata.thumbnail, safeMode)}
          className={styles.video}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPause={(event) => savePosition(event.currentTarget)}
          onEnded={handleEnded}
        >
          <source src={videoUrl(props.video.fileResource)} />
        </video>
      </div>
      <VideoSnapshotsGallery snapshots={props.snapshots} />
      <div className={styles.actionsSection}>
        <ShortcutsHelp />
        <Button color="error" variant="contained" onClick={() => setDeleteDialogVisibility(true)}>
          Delete
        </Button>
      </div>
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
