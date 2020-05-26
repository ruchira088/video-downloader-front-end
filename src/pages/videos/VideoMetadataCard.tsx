import React from "react"
import {CardContent, CardMedia} from "@material-ui/core"
import VideoMetadata from "services/models/VideoMetadata";
import ApplicationContext from "context/ApplicationContext";
import {assetUrl} from "services/asset/AssetService"
import {phraseMappings} from "services/sanitize/SanitizationService"
import {humanReadableDuration, humanReadableSize} from "utils/Formatter"
import styles from "./VideoMetadataCard.module.css"

export default (videoMetadata: VideoMetadata) => (
    <ApplicationContext.Consumer>
        {({safeMode}) =>
            <div>
                <CardMedia image={assetUrl(videoMetadata.thumbnail.id, safeMode)} title="video thumbnail" className={styles.media}/>
                <CardContent>
                    <div>{phraseMappings(videoMetadata.title)}</div>
                    <div>{humanReadableDuration(videoMetadata.duration)}</div>
                    <div>{humanReadableSize(videoMetadata.size)}</div>
                </CardContent>
            </div>
        }
    </ApplicationContext.Consumer>

)
