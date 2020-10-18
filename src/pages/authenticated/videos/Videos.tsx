import React, { useState } from "react"
import { GridList, GridListTile } from "@material-ui/core"
import { Link } from "react-router-dom"
import { None } from "monet"
import { List } from "immutable"
import { searchVideos } from "services/video/VideoService"
import InfiniteScroll from "react-infinite-scroller"
import VideoCard from "components/video/video-card/VideoCard"
import Video from "models/Video"
import { SortBy } from "models/SortBy"
import { ALL_DURATIONS, DurationRange } from "models/DurationRange"
import VideoFilter from "./components/VideoFilter"

const PAGE_SIZE = 50

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
      return searchVideos(None(), durationRange, pageNumber, PAGE_SIZE, sortBy).then(({ results }) => {
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

  const onDurationChange = (durationRange: DurationRange) => {
    setDurationRange(durationRange)
    setPageNumber(0)
    setHasMore(true)
    setVideos(List())
  }

  return (
    <>
      <VideoFilter
        sortBy={sortBy}
        onSortByChange={onSortByChange}
        durationRange={durationRange}
        onDurationRangeChange={onDurationChange}
      />
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
