import React, { useEffect, useState } from "react"
import { ImageList, ImageListItem } from "@mui/material"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Maybe, NonEmptyList } from "monet"
import { List } from "immutable"
import Axios, { CancelTokenSource } from "axios"
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
  VideoSearchParamName,
  VideoSitesSearchParam
} from "./components/VideoSearchParams"
import Range from "models/Range"
import { CANCEL } from "services/http/HttpClient"

const PAGE_SIZE = 50

let isLoading = false

const Videos = () => {
  const queryParams = new URLSearchParams(useLocation().search)
  const windowWidth = () => document.body.clientWidth

  const [videos, setVideos] = useState<List<Video>>(List<Video>())
  const [videoSites, setVideoSites] = useState<Maybe<NonEmptyList<string>>>(
    parseSearchParam(queryParams, VideoSitesSearchParam)
  )
  const [sortBy, setSortBy] = useState<SortBy>(parseSearchParam(queryParams, SortBySearchParam))
  const [searchTerm, setSearchTerm] = useState<Maybe<string>>(parseSearchParam(queryParams, SearchTermSearchParam))
  const [pageNumber, setPageNumber] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [durationRange, setDurationRange] = useState<DurationRange>(
    parseSearchParam(queryParams, DurationRangeSearchParam)
  )
  const [sizeRange, setSizeRange] = useState<Range<number>>(parseSearchParam(queryParams, SizeRangeSearchParam))
  const [cancelTokenSource, setCancelTokenSource] = useState<CancelTokenSource>(Axios.CancelToken.source())
  const [width, setWidth] = useState<number>(windowWidth())

  const navigate = useNavigate()
  const columns = Math.ceil(width / 350)

  const loadMoreVideos = (): void => {
    if (!isLoading) {
      isLoading = true

      searchVideos(searchTerm, durationRange, sizeRange, videoSites, pageNumber, PAGE_SIZE, sortBy, cancelTokenSource)
        .then(({ results }) => {
          if (results.length < PAGE_SIZE) {
            setHasMore(false)
          } else {
            setPageNumber((pageNumber) => pageNumber + 1)
          }

          setVideos((videos: List<Video>) => videos.concat(results))
        })
        .catch(() => setHasMore(false))
        .finally(() => {
          isLoading = false
        })
    }
  }

  function onChangeSearchParams<A, B extends VideoSearchParamName>(
    videoSearchParameter: VideoSearchParameter<A, B>,
    f: (value: A) => void
  ): (value: A) => void {
    return onChange(videoSearchParameter.name, videoSearchParameter.encoder.encode, f)
  }

  function onChange<A>(name: string, encoder: (value: A) => string, f: (value: A) => void): (value: A) => void {
    return (value: A) => {
      cancelTokenSource.cancel(CANCEL)
      setCancelTokenSource(Axios.CancelToken.source())
      setPageNumber(0)
      f(value)
      updateQueryParameter(name, encoder, value)
      setVideos(List())
      setHasMore(true)
      isLoading = false
    }
  }

  function updateQueryParameter<A>(name: string, encoder: (value: A) => string, value: A) {
    queryParams.set(name, encoder(value))
    navigate({ search: queryParams.toString() })
  }

  useEffect(() => {
    const onResize = () => { setWidth(windowWidth()) }

    window.addEventListener("resize", onResize)

    return () => window.removeEventListener("resize", onResize)
  })

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
        isLoading={isLoading}
      />
      <InfiniteScroll loadMore={loadMoreVideos} hasMore={hasMore} threshold={500}>
        <ImageList cols={columns} rowHeight="auto">
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

export default Videos
