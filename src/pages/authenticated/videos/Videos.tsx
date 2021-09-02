import React, { useEffect, useState } from "react"
import { ImageList, ImageListItem } from "@material-ui/core"
import { Link, useHistory, useLocation } from "react-router-dom"
import { Maybe, None, Some } from "monet"
import { List } from "immutable"
import { searchVideos } from "services/video/VideoService"
import InfiniteScroll from "react-infinite-scroller"
import VideoCard from "components/video/video-card/VideoCard"
import Video from "models/Video"
import { SortBy } from "models/SortBy"
import { ALL_DURATIONS, DurationRange, durationRangeQueryParameter, fromString } from "models/DurationRange"
import VideoFilter from "./components/VideoFilter"

const PAGE_SIZE = 50

export default () => {
  const queryParams = new URLSearchParams(useLocation().search)
  const defaultSortBy = Maybe.fromNull(queryParams.get("sort-by")).getOrElse(SortBy.Date) as SortBy
  const defaultDurationRange =
    Maybe.fromNull(queryParams.get("duration-range"))
      .flatMap(input => fromString(input))
      .getOrElse(ALL_DURATIONS)

  const [videos, setVideos] = useState<List<Video>>(List<Video>())
  const [sortBy, setSortBy] = useState<SortBy>(defaultSortBy)
  const [searchTerm, setSearchTerm] = useState<Maybe<string>>(None())
  const [pageNumber, setPageNumber] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [durationRange, setDurationRange] = useState<DurationRange>(defaultDurationRange)

  const history = useHistory()

  useEffect(() => {
    setLoading(true)

    searchVideos(searchTerm, durationRange, pageNumber, PAGE_SIZE, sortBy).then(({ results }) => {
      if (results.length < PAGE_SIZE) {
        setHasMore(false)
      }

      setVideos((videos: List<Video>) => videos.concat(results))
      setLoading(false)
    })
  }, [pageNumber, sortBy, durationRange, searchTerm])

  const fetchVideos = (): void => {
    if (!isLoading) {
      setPageNumber((pageNumber: number) => pageNumber + 1)
    }
  }

  const onSortByChange = (sortBy: SortBy) => {
    setSortBy(sortBy)
    setPageNumber(0)
    setHasMore(true)
    setVideos(List())

    queryParams.set("sort-by", sortBy)
    history.push({ search: queryParams.toString() })
  }

  const onDurationChange = (durationRange: DurationRange) => {
    setDurationRange(durationRange)
    setPageNumber(0)
    setHasMore(true)
    setVideos(List())

    queryParams.set("duration-range", durationRangeQueryParameter(durationRange))
    history.push({ search: queryParams.toString() })
  }

  const onSearchTermChange = (term: string) => {
    if (term.trim() === "") {
      setSearchTerm(None())
    } else {
      setSearchTerm(Some(term))
    }

    setPageNumber(0)
    setHasMore(true)
    setVideos(List())
  }

  return (
    <>
      <VideoFilter
        videoTitles={videos.map((video) => video.videoMetadata.title).slice(0, 10)}
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        sortBy={sortBy}
        onSortByChange={onSortByChange}
        durationRange={durationRange}
        onDurationRangeChange={onDurationChange}
      />
      <InfiniteScroll loadMore={fetchVideos} hasMore={hasMore} threshold={500}>
        <ImageList cols={4} rowHeight="auto">
          {videos.map((video, index) => (
            <ImageListItem cols={1} key={index}>
              <Link to={`/video/${video.videoMetadata.id}`} key={index}>
                <VideoCard {...video} />
              </Link>
            </ImageListItem>
          ))}
        </ImageList>
      </InfiniteScroll>
    </>
  )
}
