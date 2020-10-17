import React, {useState} from "react"
import {GridList, GridListTile} from "@material-ui/core"
import {Link} from "react-router-dom"
import {None} from "monet"
import {List} from "immutable"
import {searchVideos} from "services/video/VideoService"
import InfiniteScroll from "react-infinite-scroller"
import VideoCard from "components/video/video-card/VideoCard"
import Video from "models/Video"
import {SortBy} from "models/SortBy";
import SortBySelection from "components/sort-by-selection/SortBySelection";

const PAGE_SIZE = 50

export default () => {
    const [videos, setVideos] = useState<List<Video>>(List<Video>())
    const [sortBy, setSortBy] = useState<SortBy>(SortBy.Date)
    const [pageNumber, setPageNumber] = useState<number>(0)
    const [hasMore, setHasMore] = useState<boolean>(true)

    const fetchVideos = (): Promise<void> =>
        searchVideos(None(), pageNumber, PAGE_SIZE, sortBy).then(({results}) => {
            if (results.length < PAGE_SIZE) {
                setHasMore(false)
            }

            setVideos((videos: List<Video>) => videos.concat(results))
            setPageNumber((pageNumber: number) => pageNumber + 1)
        })

    const onSortByChange = (sortBy: SortBy) => {
        setSortBy(sortBy)
        setPageNumber(0)
        setHasMore(true)
        setVideos(List())
    }

    return (
        <>
            <SortBySelection value={sortBy} onChange={onSortByChange}/>
            <InfiniteScroll loadMore={fetchVideos} hasMore={hasMore} threshold={500}>
                <GridList cols={4} cellHeight="auto">
                    {videos.map((video, index) => (
                        <GridListTile cols={1} key={index}>
                            <Link to={`/video/${video.videoMetadata.id}`} key={index}>
                                <VideoCard {...video} />
                            </Link>
                        </GridListTile>
                    ))}
                </GridList>
            </InfiniteScroll>
        </>
    )
}
