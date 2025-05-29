import React, {useRef, useState} from "react"
import Axios, {type CancelTokenSource} from "axios"
import {searchVideos} from "~/services/video/VideoService"
import {Video} from "~/models/Video"
import {type SortBy} from "~/models/SortBy"
import {type DurationRange} from "~/models/DurationRange"
import VideoSearch from "./components/VideoSearch"
import {
  DurationRangeSearchParam,
  parseSearchParam,
  SearchTermSearchParam,
  SizeRangeSearchParam,
  SortBySearchParam,
  type VideoSearchParameter,
  VideoSearchParamName,
  VideoSitesSearchParam
} from "./components/VideoSearchParams"
import {Range} from "~/models/Range"
import {CANCEL} from "~/services/http/HttpClient"
import {Link, useNavigate, useSearchParams} from "react-router"
import type {Option} from "~/types/Option"
import VideoCard from "~/components/video/video-card/VideoCard"

import styles from "./Videos.module.scss"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll";

const PAGE_SIZE = 50

const Videos = () => {
  const [queryParams] = useSearchParams()
  const navigate = useNavigate()

  const [videos, setVideos] = useState<Video[]>([])
  const [videoSites, setVideoSites] = useState<string[]>(parseSearchParam(queryParams, VideoSitesSearchParam))
  const [sortBy, setSortBy] = useState<SortBy>(parseSearchParam(queryParams, SortBySearchParam))
  const [searchTerm, setSearchTerm] = useState<Option<string>>(parseSearchParam(queryParams, SearchTermSearchParam))
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [durationRange, setDurationRange] = useState<DurationRange>(parseSearchParam(queryParams, DurationRangeSearchParam))
  const [sizeRange, setSizeRange] = useState<Range<number>>(parseSearchParam(queryParams, SizeRangeSearchParam))
  const [cancelTokenSource, setCancelTokenSource] = useState<CancelTokenSource>(Axios.CancelToken.source())
  const pageNumber = useRef(0)
  const isLoading = useRef(false)

  const loadMoreVideos = async (): Promise<void> => {
    if (!isLoading.current) {
      isLoading.current = true

      try {
        const {results} = await searchVideos(
            searchTerm,
            durationRange,
            sizeRange,
            videoSites,
            pageNumber.current,
            PAGE_SIZE,
            sortBy,
            cancelTokenSource
        )

        if (results.length < PAGE_SIZE) {
          setHasMore(false)
        } else {
          pageNumber.current += 1
        }

        setVideos(videos => videos.concat(results))
      } finally {
        isLoading.current = false
      }
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
      pageNumber.current = 0
      f(value)
      updateQueryParameter(name, encoder, value)
      setVideos([])
      setHasMore(true)
      isLoading.current = false
    }
  }

  function updateQueryParameter<A>(name: string, encoder: (value: A) => string, value: A) {
    queryParams.set(name, encoder(value))
    navigate({ search: queryParams.toString() })
  }

  return (
    <div className={styles.videosPage}>
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
        isLoading={isLoading.current}
      />

      <InfiniteScroll loadMore={loadMoreVideos} isLoading={isLoading.current} hasMore={hasMore} className={styles.videosList}>
        {
          videos.map(
              (video, index) =>
                  <Link to={`/video/${video.videoMetadata.id}`} key={index} className={styles.videoCard}>
                    <VideoCard video={video}/>
                  </Link>
          )
        }
      </InfiniteScroll>

    </div>
  )
}

export default Videos
