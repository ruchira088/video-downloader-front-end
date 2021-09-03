import React, { useEffect, useState } from "react"
import { ImageList, ImageListItem } from "@material-ui/core"
import { Link, useHistory, useLocation } from "react-router-dom"
import { Maybe, NonEmptyList } from "monet"
import { List } from "immutable"
import { searchVideos } from "services/video/VideoService"
import InfiniteScroll from "react-infinite-scroller"
import VideoCard from "components/video/video-card/VideoCard"
import Video from "models/Video"
import { SortBy } from "models/SortBy"
import { DurationRange } from "models/DurationRange"
import VideoSearch from "./components/VideoSearch"
import {
  DurationRangeSearchParam,
  parseSearchParam,
  SearchTermSearchParam,
  SizeRangeSearchParam,
  SortBySearchParam,
  VideoSearchParameter,
  VideoSearchParamName, VideoSitesSearchParam
} from "./components/VideoSearchParams"
import { Range } from "models/Range"

const PAGE_SIZE = 50

export default () => {
  const queryParams = new URLSearchParams(useLocation().search)

  const [videos, setVideos] = useState<List<Video>>(List<Video>())
  const [videoSites, setVideoSites] = useState<Maybe<NonEmptyList<string>>>(parseSearchParam(queryParams, VideoSitesSearchParam))
  const [sortBy, setSortBy] = useState<SortBy>(parseSearchParam(queryParams, SortBySearchParam))
  const [searchTerm, setSearchTerm] = useState<Maybe<string>>(parseSearchParam(queryParams, SearchTermSearchParam))
  const [pageNumber, setPageNumber] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [durationRange, setDurationRange] = useState<DurationRange>(parseSearchParam(queryParams, DurationRangeSearchParam))
  const [sizeRange, setSizeRange] = useState<Range<number>>(parseSearchParam(queryParams, SizeRangeSearchParam))

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

  function onChangeSearchParams<A, B extends VideoSearchParamName>(videoSearchParameter: VideoSearchParameter<A, B>, f: (value: A) => void): (value: A) => void {
    return onChange(videoSearchParameter.name, videoSearchParameter.encoder.encode, f)
  }

  function onChange<A>(name: string, encoder: (value: A) => string, f: (value: A) => void): (value: A) => void {
    return (value: A) => {
      f(value)
      setPageNumber(0)
      setHasMore(true)
      setVideos(List())
      updateQueryParameter(name, encoder, value)
    }
  }

  function updateQueryParameter<A>(name: string, encoder: (value: A) => string, value: A) {
    queryParams.set(name, encoder(value))
    history.push({ search: queryParams.toString() })
  }

  return (
    <>
      <VideoSearch
        videoTitles={videos.map((video) => video.videoMetadata.title).slice(0, 10)}
        searchTerm={searchTerm}
        onSearchTermChange={onChangeSearchParams(SearchTermSearchParam, setSearchTerm)}
        sortBy={sortBy}
        onSortByChange={onChangeSearchParams(SortBySearchParam, setSortBy)}
        durationRange={durationRange}
        onDurationRangeChange={onChangeSearchParams(DurationRangeSearchParam, setDurationRange)}
        sizeRange={sizeRange}
        onSizeRangeChange={onChangeSearchParams(SizeRangeSearchParam, setSizeRange)}
        videoSites={videoSites}
        onVideoSitesChange={onChangeSearchParams(VideoSitesSearchParam, setVideoSites)}
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
