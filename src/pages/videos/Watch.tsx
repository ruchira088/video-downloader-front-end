import React from "react"
import ApplicationContext from "context/ApplicationContext";
import Video from "services/models/Video";
import {assetUrl} from "services/asset/AssetService"
import styles from "./Watch.module.css"

export default (video: Video) => (
    <ApplicationContext.Consumer>
        {({safeMode}) =>
            <div>
                <video controls preload="auto" poster={assetUrl(video.videoMetadata.thumbnail.id, safeMode)} className={styles.video}>
                    <source src={assetUrl(video.fileResource.id, false)} type={video.fileResource.mediaType}/>
                </video>
            </div>
        }
    </ApplicationContext.Consumer>
)
