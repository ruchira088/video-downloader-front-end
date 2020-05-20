import React from "react"
import VideoMetadata from "services/models/VideoMetadata";
import ApplicationContext from "context/ApplicationContext";
import {assetUrl} from "services/asset/AssetService"
import {phraseMappings} from "services/sanitize/SanitizationService"
import {humanReadableDuration, humanReadableSize} from "utils/Formatter"

export default (videoMetadata: VideoMetadata) => (
    <ApplicationContext.Consumer>
        {({safeMode}) =>
            <div className="vide-metadata-card">
                <img alt="video-thumbnail" src={assetUrl(videoMetadata.thumbnail.id, safeMode)}/>
                <div>{phraseMappings(videoMetadata.title)}</div>
                <div>{humanReadableDuration(videoMetadata.duration)}</div>
                <div>{humanReadableSize(videoMetadata.size)}</div>
            </div>
        }
    </ApplicationContext.Consumer>

)
