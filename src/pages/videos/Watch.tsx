import React from "react"
import ApplicationContext from "context/ApplicationContext";
import Video from "services/models/Video";
import {assetUrl} from "services/asset/AssetService"

export default (video: Video) => (
    <ApplicationContext.Consumer>
        {({safeMode}) =>
            <div className="video">
                <video controls preload="auto" poster={assetUrl(video.videoMetadata.thumbnail.id, safeMode)}>
                    <source src={assetUrl(video.fileResource.id, false)} type={video.fileResource.mediaType}/>
                </video>
            </div>
        }
    </ApplicationContext.Consumer>
)
