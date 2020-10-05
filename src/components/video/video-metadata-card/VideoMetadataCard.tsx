import React from "react"
import VideoMetadata from "models/VideoMetadata"
import ApplicationContext from "context/ApplicationContext"
import { thumbnailUrl } from "services/asset/AssetService"
import translate from "services/translation/TranslationService"
import { humanReadableDuration, humanReadableSize } from "utils/Formatter"
import styles from "./VideoMetadataCard.module.css"
import { VideoAnalysisResult } from "models/VideoAnalysisResult"

export default (metadata: VideoMetadata | VideoAnalysisResult) => (
  <ApplicationContext.Consumer>
    {({ safeMode }) => (
      <div className={styles.videoMetadataCard}>
        <div className={styles.imageContainer}>
          <img src={thumbnailUrl(metadata.thumbnail, safeMode)} alt="video thumbnail" className={styles.thumbnail} />
        </div>
        <div>
          <div>{translate(metadata.title, safeMode)}</div>
          <div>{humanReadableDuration(metadata.duration)}</div>
          <div>{humanReadableSize(metadata.size)}</div>
        </div>
      </div>
    )}
  </ApplicationContext.Consumer>
)
