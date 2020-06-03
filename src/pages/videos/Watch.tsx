import React from "react"
import ApplicationContext from "context/ApplicationContext";
import Video from "services/models/Video";
import {imageUrl, videoUrl} from "services/asset/AssetService"
import styles from "./Watch.module.css"

export default (video: Video) => (
    <ApplicationContext.Consumer>
        {({safeMode}) =>
            <div>
                <video controls preload="auto" poster={imageUrl(video.videoMetadata.thumbnail.id, safeMode)} className={styles.video}>
                    <source src={videoUrl(video.fileResource.id)} type={video.fileResource.mediaType}/>
                </video>
                <div>
                    { video.videoMetadata.title }
                </div>
            </div>
        }
    </ApplicationContext.Consumer>
)
