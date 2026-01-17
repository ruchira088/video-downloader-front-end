import React, { type FC } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IconButton } from "@mui/material"
import DragIndicator from "@mui/icons-material/DragIndicator"
import Delete from "@mui/icons-material/Delete"
import PlayArrow from "@mui/icons-material/PlayArrow"
import { Video } from "~/models/Video"
import { imageUrl } from "~/services/asset/AssetService"
import { shortHumanReadableDuration } from "~/utils/Formatter"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import { translate } from "~/services/sanitize/SanitizationService"

import styles from "./PlaylistVideoCard.module.scss"

type PlaylistVideoCardProps = {
  readonly video: Video
  readonly index: number
  readonly onRemove: () => void
  readonly onPlay: () => void
  readonly isCurrentlyPlaying: boolean
}

const PlaylistVideoCard: FC<PlaylistVideoCardProps> = ({
  video,
  index,
  onRemove,
  onPlay,
  isCurrentlyPlaying
}) => {
  const { safeMode } = useApplicationConfiguration()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: video.videoMetadata.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const title = translate(video.videoMetadata.title, safeMode)
  const thumbnailUrl = imageUrl(video.videoMetadata.thumbnail, safeMode)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.playlistVideoCard} ${isCurrentlyPlaying ? styles.playing : ""}`}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <DragIndicator />
      </div>
      <span className={styles.index}>{index + 1}</span>
      <div className={styles.thumbnail}>
        <img src={thumbnailUrl} alt={title} />
        <span className={styles.duration}>
          {shortHumanReadableDuration(video.videoMetadata.duration)}
        </span>
      </div>
      <div className={styles.info}>
        <span className={styles.title}>{title}</span>
        <span className={styles.site}>{video.videoMetadata.videoSite}</span>
      </div>
      <div className={styles.actions}>
        <IconButton
          onClick={onPlay}
          size="small"
          color={isCurrentlyPlaying ? "primary" : "default"}
        >
          <PlayArrow />
        </IconButton>
        <IconButton onClick={onRemove} size="small" color="error">
          <Delete />
        </IconButton>
      </div>
    </div>
  )
}

export default PlaylistVideoCard
