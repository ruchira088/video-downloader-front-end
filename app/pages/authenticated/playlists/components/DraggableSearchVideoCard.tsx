import React, { type FC } from "react"
import { IconButton } from "@mui/material"
import Add from "@mui/icons-material/Add"
import { Video } from "~/models/Video"
import { imageUrl } from "~/services/asset/AssetService"
import { shortHumanReadableDuration, humanReadableSize } from "~/utils/Formatter"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import { translate } from "~/services/sanitize/SanitizationService"

import styles from "./DraggableSearchVideoCard.module.scss"

type DraggableSearchVideoCardProps = {
  readonly video: Video
  readonly onAdd: () => void
  readonly isAdding: boolean
}

const DraggableSearchVideoCard: FC<DraggableSearchVideoCardProps> = ({
  video,
  onAdd,
  isAdding
}) => {
  const { safeMode } = useApplicationConfiguration()

  const title = translate(video.videoMetadata.title, safeMode)
  const thumbnailUrl = imageUrl(video.videoMetadata.thumbnail, safeMode)

  return (
    <div className={styles.card}>
      <div className={styles.thumbnail}>
        <img src={thumbnailUrl} alt={title} />
        <span className={styles.duration}>
          {shortHumanReadableDuration(video.videoMetadata.duration)}
        </span>
      </div>
      <div className={styles.info}>
        <span className={styles.title}>{title}</span>
        <div className={styles.meta}>
          <span className={styles.site}>{video.videoMetadata.videoSite}</span>
          <span className={styles.size}>{humanReadableSize(video.videoMetadata.size)}</span>
        </div>
      </div>
      <IconButton
        onClick={onAdd}
        disabled={isAdding}
        color="primary"
        size="small"
        className={styles.addButton}
      >
        <Add />
      </IconButton>
    </div>
  )
}

export default DraggableSearchVideoCard
