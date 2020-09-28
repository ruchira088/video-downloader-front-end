import React, {useState} from "react"
import {GridList, GridListTile} from "@material-ui/core"
import {Link} from "react-router-dom"
import {None} from "monet";
import {searchVideos, VideoJson} from "services/video/VideoService"
import InfiniteScroll from "react-infinite-scroller"
import VideoCard from "components/video/video-card/VideoCard"
import {parseVideo} from "utils/ResponseParser";
import LoginForm from "../../components/login-form/LoginForm";

const PAGE_SIZE = 50

export default () => {
    const [videos, setVideos] = useState<VideoJson[]>([])
    const [hasMore, setHasMore] = useState<boolean>(true)

    const fetchVideos =
        (pageNumber: number): Promise<void> =>
            searchVideos(None(), pageNumber - 1, PAGE_SIZE)
                .then(({results}) => {
                    if (results.length < PAGE_SIZE) {
                        setHasMore(false)
                    }

                    setVideos(videos => videos.concat(results))
                })

    return (
        <InfiniteScroll pageStart={0} loadMore={fetchVideos} hasMore={hasMore} threshold={500}>
            <LoginForm/>
            <GridList cols={4} cellHeight="auto">
                {
                    videos.map(parseVideo).map((video, index) =>
                        <GridListTile cols={1} key={index}>
                            <Link to={`/video/${video.videoMetadata.id}`} key={index}>
                                <VideoCard {...video}/>
                            </Link>
                        </GridListTile>
                    )
                }
            </GridList>
        </InfiniteScroll>
    )
}
