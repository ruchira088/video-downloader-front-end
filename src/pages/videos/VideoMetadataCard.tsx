import React from "react"
import VideoMetadata from "services/models/VideoMetadata";
import {assetUrl} from "services/asset/AssetService"
import {phraseMappings} from "services/sanitize/SanitizationService"
import {humanReadableSize, humanReadableDuration} from "utils/Formatter"

export default (videoMetadata: VideoMetadata) => (
    <div className="vide-metadata-card">
        <img alt="video-thumbnail" src={assetUrl(videoMetadata.thumbnail.id)}/>
        <div>{phraseMappings(videoMetadata.title)}</div>
        <div>{humanReadableDuration(videoMetadata.duration)}</div>
        <div>{humanReadableSize(videoMetadata.size)}</div>
    </div>
)
