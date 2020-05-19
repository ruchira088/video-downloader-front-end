import React, {useEffect, useState} from "react"
import {useParams} from "react-router-dom";
import {Maybe, None, Some} from "monet";
import Video from "services/models/Video"
import loadableComponent from "components/hoc/loadableComponent"
import {fetchVideoById} from "services/video/VideoService"
import VideoPlay from "./Watch";

export default () => {
    const { videoId } = useParams()
    const [video, setVideo] = useState<Maybe<Video>>(None())

    useEffect(() => {
        fetchVideoById(videoId)
            .then(video => setVideo(Some(video)))
    }, [ videoId ])

    return (
        <div className="video-page">
            { loadableComponent(VideoPlay, video) }
        </div>
    )
}

