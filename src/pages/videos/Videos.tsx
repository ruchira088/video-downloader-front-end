import React, {useEffect, useState} from "react"
import {GridList, GridListTile} from "@material-ui/core"
import {Link} from "react-router-dom"
import {searchVideos} from "services/video/VideoService"
import {None} from "monet";
import Video from "services/models/Video";
import VideoCard from "./VideoCard";

export default () => {
    const [videos, setVideos] = useState<Video[]>([])

    useEffect(() => {
        searchVideos(None(), 0, 50)
            .then(({results}) => setVideos(results))
    }, [])

    return (
        <GridList cols={4} cellHeight="auto">
            {videos.map(video =>
                <GridListTile cols={1} key={video.videoMetadata.id}>
                    <Link to={`/video/${video.videoMetadata.id}`} key={video.videoMetadata.id}>
                        <VideoCard {...video}/>
                    </Link>
                </GridListTile>
            )}
        </GridList>
    )
}
