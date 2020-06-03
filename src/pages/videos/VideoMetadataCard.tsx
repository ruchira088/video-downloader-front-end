import React from "react"
import {CardContent, CardMedia} from "@material-ui/core"
import VideoMetadata from "services/models/VideoMetadata";
import ApplicationContext from "context/ApplicationContext";
import {thumbnailUrl} from "services/asset/AssetService"
import translate from "services/translation/TranslationService"
import {humanReadableDuration, humanReadableSize} from "utils/Formatter"
import styles from "./VideoMetadataCard.module.css"
import {VideoAnalysisResult} from "services/models/VideoAnalysisResult";

export default (metadata: VideoMetadata | VideoAnalysisResult) => (
    <ApplicationContext.Consumer>
        {({safeMode}) =>
            <div>
                <CardMedia image={thumbnailUrl(metadata.thumbnail, safeMode)} title="video thumbnail" className={styles.media}/>
                <CardContent>
                    <div>{translate(metadata.title, safeMode)}</div>
                    <div>{humanReadableDuration(metadata.duration)}</div>
                    <div>{humanReadableSize(metadata.size)}</div>
                </CardContent>
            </div>
        }
    </ApplicationContext.Consumer>
)
