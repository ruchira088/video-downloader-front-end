import React, {useEffect, useState} from "react"
import {GridList, GridListTile} from "@material-ui/core"
import {Link} from "react-router-dom"
import {searchVideos, VideoJson} from "services/video/VideoService"
import {Maybe, None} from "monet";
import VideoCard from "components/video/video-card/VideoCard";
import {parseVideo} from "services/models/ResponseParser";

export default () => {
    const [videos, setVideos] = useState<VideoJson[]>([])

    useEffect(() => {
        const fetchVideos =
            (searchTerm: Maybe<string>, pageNumber: number, pageSize: number): Promise<number> =>
                searchVideos(searchTerm, pageNumber, pageSize)
                    .then(({results}) => {
                        setVideos(videos => videos.concat(results))

                        if (results.length === pageSize) {
                            return fetchVideos(searchTerm, pageNumber + 1, pageSize)
                        } else {
                            return Promise.resolve(pageNumber)
                        }
                    })

        fetchVideos(None(), 0, 50)
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
