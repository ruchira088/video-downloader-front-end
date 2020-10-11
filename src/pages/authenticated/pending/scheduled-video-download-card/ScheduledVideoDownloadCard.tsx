import React from "react"
import ApplicationContext from "context/ApplicationContext"
import ScheduledVideoDownload from "models/ScheduledVideoDownload"
import { imageUrl } from "services/asset/AssetService"
import translate from "services/translation/TranslationService"
import ProgressBar from "pages/authenticated/pending/download-progress-bar/DownloadProgressBar"
import { humanReadableDuration, humanReadableSize } from "utils/Formatter"
import styles from "./ScheduledVideoDownloadCard.module.css"
import { Downloadable } from "../ScheduledVideos"
import DownloadInformation from "./DownloadInformation";

export default (scheduledVideoDownload: ScheduledVideoDownload & Downloadable) => (
  <ApplicationContext.Consumer>
    {({ safeMode }) => (
      <div className={styles.card}>
        <img alt="thumbnail" src={imageUrl(scheduledVideoDownload.videoMetadata.thumbnail.id, safeMode)} />
        <div>{translate(scheduledVideoDownload.videoMetadata.title, safeMode)}</div>
        <div>{humanReadableDuration(scheduledVideoDownload.videoMetadata.duration)}</div>
        <div>{humanReadableSize(scheduledVideoDownload.videoMetadata.size)}</div>
        {scheduledVideoDownload.videoMetadata.size !== scheduledVideoDownload.downloadedBytes && (
          <div>
            <ProgressBar
              completeValue={scheduledVideoDownload.videoMetadata.size}
              currentValue={scheduledVideoDownload.downloadedBytes}
            />
            <DownloadInformation {...scheduledVideoDownload}/>
          </div>
        )}
      </div>
    )}
  </ApplicationContext.Consumer>
)
