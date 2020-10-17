import React, {useState} from "react"
import {GridList, GridListTile, Slider} from "@material-ui/core"
import {Link} from "react-router-dom"
import {None, Some} from "monet"
import {List} from "immutable"
import {searchVideos} from "services/video/VideoService"
import InfiniteScroll from "react-infinite-scroller"
import VideoCard from "components/video/video-card/VideoCard"
import Video from "models/Video"
import {SortBy} from "models/SortBy"
import SortBySelection from "components/sort-by-selection/SortBySelection"
import {ALL as ALL_DURATIONS, DurationRange} from "models/DurationRange"
import moment from "moment"
import {humanReadableDuration} from "utils/Formatter"

const PAGE_SIZE = 50
const MAX_DURATION = 75

let isPending = false

export default () => {
    const [videos, setVideos] = useState<List<Video>>(List<Video>())
    const [sortBy, setSortBy] = useState<SortBy>(SortBy.Date)
    const [pageNumber, setPageNumber] = useState<number>(0)
    const [hasMore, setHasMore] = useState<boolean>(true)
    const [durationRange, setDurationRange] = useState<DurationRange>(ALL_DURATIONS)

    const fetchVideos = (): Promise<void> => {
        if (isPending) {
            return Promise.resolve()
        } else {
            isPending = true
            return searchVideos(None(), durationRange, pageNumber, PAGE_SIZE, sortBy).then(({results}) => {
                if (results.length < PAGE_SIZE) {
                    setHasMore(false)
                }

                setVideos((videos: List<Video>) => videos.concat(results))
                isPending = false
                setPageNumber((pageNumber: number) => pageNumber + 1)
            })
        }
    }

    const onSortByChange = (sortBy: SortBy) => {
        setSortBy(sortBy)
        setPageNumber(0)
        setHasMore(true)
        setVideos(List())
    }

    const range = [
        durationRange.min.map((duration) => duration.asMinutes()).getOrElse(0),
        durationRange.max.map((duration) => duration.asMinutes()).getOrElse(MAX_DURATION),
    ]

    const onDurationChange = (event: React.ChangeEvent<{}>, value: number | number[]) => {
        const [min, max] = ([] as number[]).concat(value)

        setDurationRange({
            min: Some(moment.duration(min, "minutes")),
            max: max === MAX_DURATION ? None() : Some(moment.duration(max, "minutes")),
        })

        setTimeout(() => {
            setPageNumber(0)
            setHasMore(true)
            setVideos(List())
        }, 250)
    }

    return (
        <>
            <SortBySelection value={sortBy} onChange={onSortByChange}/>
            <Slider min={0} max={MAX_DURATION} value={range} onChangeCommitted={onDurationChange}/>
            <div>{durationRange.min.map(humanReadableDuration).getOrElse("0")}</div>
            <div>{durationRange.max.map(humanReadableDuration).getOrElse(`${MAX_DURATION}+ minutes`)}</div>
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
