import React from "react"
import ApplicationContext from "context/ApplicationContext";
import ScheduledVideoDownload from "services/models/ScheduledVideoDownload";
import {imageUrl} from "services/asset/AssetService";
import translate from "services/translation/TranslationService";
import ProgressBar from "components/DownloadProgressBar";
import {humanReadableDuration} from "utils/Formatter"

export default (activeDownload: ScheduledVideoDownload) => (
    <ApplicationContext.Consumer>
        {({safeMode}) =>
            <div className="active-download">
                <img alt="thumbnail" src={imageUrl(activeDownload.videoMetadata.thumbnail.id, safeMode)}/>
                <div>{translate(activeDownload.videoMetadata.title, safeMode)}</div>
                <div>{humanReadableDuration(activeDownload.videoMetadata.duration)}</div>
                <ProgressBar completeValue={activeDownload.videoMetadata.size}
                             currentValue={activeDownload.downloadedBytes}/>
            </div>
        }
    </ApplicationContext.Consumer>

)
