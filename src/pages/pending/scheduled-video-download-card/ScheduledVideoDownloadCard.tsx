import React from "react"
import ApplicationContext from "context/ApplicationContext";
import ScheduledVideoDownload from "services/models/ScheduledVideoDownload";
import {imageUrl} from "services/asset/AssetService";
import translate from "services/translation/TranslationService";
import ProgressBar from "components/DownloadProgressBar";
import {humanReadableDuration} from "utils/Formatter"
import styles from "./ScheduledVideoDownloadCard.module.css"

export default (scheduledVideoDownload: ScheduledVideoDownload) => (
    <ApplicationContext.Consumer>
        {({safeMode}) =>
            <div className={styles.card}>
                <img alt="thumbnail" src={imageUrl(scheduledVideoDownload.videoMetadata.thumbnail.id, safeMode)}/>
                <div>{translate(scheduledVideoDownload.videoMetadata.title, safeMode)}</div>
                <div>{humanReadableDuration(scheduledVideoDownload.videoMetadata.duration)}</div>
                {
                    scheduledVideoDownload.completedAt.isNone() &&
                    <ProgressBar completeValue={scheduledVideoDownload.videoMetadata.size}
                                 currentValue={scheduledVideoDownload.downloadedBytes}/>
                }
            </div>
        }
    </ApplicationContext.Consumer>
)
