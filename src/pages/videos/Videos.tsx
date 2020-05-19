import React, { useState, useEffect } from "react"
import {Link} from "react-router-dom"
import { searchVideos } from "services/video/VideoService"
import {None} from "monet";
import Video from "services/models/Video";
import VideoCard from "./VideoCard";

export default () => {
    const [videos, setVideos] = useState<Video[]>([])

    useEffect(() => {
        searchVideos(None(), 0, 50)
            .then(({ results }) => setVideos(results))
    }, [])

    return (
        <div className="video-list">
            { videos.map(video =>
                <Link to={`/video/${video.videoMetadata.id}`} key={video.videoMetadata.id}>
                    <VideoCard {...video}/>
                </Link>
                ) }
        </div>
    )
}
