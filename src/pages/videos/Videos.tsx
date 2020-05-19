import React, { useState, useEffect } from "react"
import { searchVideos } from "../../services/video/VideoService"
import {None} from "monet";
import Video from "../../services/models/Video";
import VideoCard from "./VideoCard";

export default () => {
    const [videos, setVideos] = useState<Video[]>([])

    useEffect(() => {
        searchVideos(None(), 0, 50)
            .then(({ results }) => setVideos(results))
    }, [])

    return (
        <div className="video-list">
            { videos.map(video => <VideoCard {...video} key={video.videoMetadata.id}/>) }
        </div>
    )
}
