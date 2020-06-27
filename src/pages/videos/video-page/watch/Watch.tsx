import React from "react"
import ApplicationContext from "context/ApplicationContext";
import Video from "services/models/Video";
import {imageUrl, videoUrl} from "services/asset/AssetService"
import {Snapshot} from "services/models/Snapshot";
import translate from "services/translation/TranslationService"
import VideoSnapshots from "components/video/video-snapshots/VideoSnapshots";
import styles from "./Watch.module.css"

export default (video: Video & { snapshots: Snapshot[] }) => (
    <ApplicationContext.Consumer>
        {({safeMode}) =>
            <div className={styles.watch}>
                <div className={styles.title}>
                    { translate(video.videoMetadata.title, safeMode) }
                </div>
                <video controls preload="auto" poster={imageUrl(video.videoMetadata.thumbnail.id, safeMode)} className={styles.video}>
                    <source src={videoUrl(video.fileResource.id)} type={video.fileResource.mediaType}/>
                </video>
                <VideoSnapshots snapshots={video.snapshots}/>
            </div>
        }
    </ApplicationContext.Consumer>
)
