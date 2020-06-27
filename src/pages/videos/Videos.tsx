import React, {useEffect, useState} from "react"
import {GridList, GridListTile} from "@material-ui/core"
import {Link} from "react-router-dom"
import {searchVideos, VideoJson} from "services/video/VideoService"
import {None} from "monet";
import VideoCard from "components/video/video-card/VideoCard";
import {parseVideo} from "services/models/ResponseParser";

export default () => {
    const [videos, setVideos] = useState<VideoJson[]>([])

    useEffect(() => {
        searchVideos(None(), 0, 50)
            .then(({results}) => setVideos(results))
    }, [])

    return (
        <GridList cols={4} cellHeight="auto">
            {videos.map(parseVideo).map(video =>
                <GridListTile cols={1} key={video.videoMetadata.id}>
                    <Link to={`/video/${video.videoMetadata.id}`} key={video.videoMetadata.id}>
                        <VideoCard {...video}/>
                    </Link>
                </GridListTile>
            )}
        </GridList>
    )
}
