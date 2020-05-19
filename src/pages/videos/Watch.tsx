import React from "react"
import Video from "services/models/Video";
import {assetUrl} from "services/asset/AssetService"

export default (video: Video) => (
    <div className="video">
        <video controls preload="auto" poster={assetUrl(video.videoMetadata.thumbnail.id)}>
            <source src={assetUrl(video.fileResource.id,true)} type={video.fileResource.mediaType}/>
        </video>
    </div>
)
