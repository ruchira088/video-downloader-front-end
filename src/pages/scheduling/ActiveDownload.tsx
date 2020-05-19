import React from "react"
import ScheduledVideoDownload from "services/models/ScheduledVideoDownload";
import {assetUrl} from "services/asset/AssetService";
import translate from "services/translation/TranslationService";
import ProgressBar from "components/DownloadProgressBar";
import {humanReadableDuration} from "utils/Formatter";

export default (activeDownload: ScheduledVideoDownload) => (
    <div className="active-download">
        <img alt="thumbnail" src={assetUrl(activeDownload.videoMetadata.thumbnail.id)}/>
        <div>{translate(activeDownload.videoMetadata.title)}</div>
        <div>{humanReadableDuration(activeDownload.videoMetadata.duration)}</div>
        <ProgressBar completeValue={activeDownload.videoMetadata.size} currentValue={activeDownload.downloadedBytes}/>
    </div>
)
