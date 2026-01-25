import React, { useEffect, useMemo, useRef, useState } from "react"
import { searchVideos } from "~/services/video/VideoService"
import { Video } from "~/models/Video"
import { type SortBy } from "~/models/SortBy"
import { type DurationRange } from "~/models/DurationRange"
import VideoSearch from "./components/VideoSearch"
import {
  DurationRangeSearchParam,
  OrderingSearchParam,
  parseSearchParam,
  SearchTermSearchParam,
  SizeRangeSearchParam,
  SortBySearchParam,
  type VideoSearchParameter,
  VideoSearchParamName,
  VideoSitesSearchParam
} from "./components/VideoSearchParams"
import { Range } from "~/models/Range"
import { Link, useSearchParams } from "react-router"
import type { Option } from "~/types/Option"
import VideoCard from "~/components/video/video-card/VideoCard"

import styles from "./Videos.module.scss"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import type { Ordering } from "~/models/Ordering"
import Helmet from "~/components/helmet/Helmet"

const PAGE_SIZE = 50

const Videos = () => {
  const [queryParams, setQueryParams] = useSearchParams()

  const [videos, setVideos] = useState<Video[]>([])
  const videoSites: string[] = parseSearchParamsMemo(queryParams, VideoSitesSearchParam)
  const sortBy: SortBy = parseSearchParamsMemo(queryParams, SortBySearchParam)
  const searchTerm: Option<string> = parseSearchParamsMemo(queryParams, SearchTermSearchParam)
  const durationRange: DurationRange = parseSearchParamsMemo(queryParams, DurationRangeSearchParam)
  const sizeRange: Range<number> = parseSearchParamsMemo(queryParams, SizeRangeSearchParam)
  const ordering: Ordering = parseSearchParamsMemo(queryParams, OrderingSearchParam)
  const abortController = useRef(new AbortController())
  const [pageNumber, setPageNumber] = useState(0)
  const isLoading = useRef(false)
  const hasMore = useRef(true)
  const fetchedPages = useRef(new Set<number>())

  const loadVideos = async (pageNumber: number): Promise<void> => {
    if (!fetchedPages.current.has(pageNumber)) {
      isLoading.current = true
      fetchedPages.current.add(pageNumber)

      try {
        const {results} = await searchVideos(
          searchTerm,
          durationRange,
          sizeRange,
          videoSites,
          pageNumber,
          PAGE_SIZE,
          sortBy,
          ordering,
          abortController.current.signal
        )

        if (results.length < PAGE_SIZE) {
          hasMore.current = false
        }

        setVideos(videos => videos.concat(results))
      } finally {
        isLoading.current = false
      }
    }
  }

  useEffect(() => {
    fetchedPages.current = new Set<number>()
    hasMore.current = true
    isLoading.current = false
    setVideos([])
    setPageNumber(0)
    loadVideos(0)
  }, [videoSites, sortBy, searchTerm, durationRange, sizeRange, ordering])

  useEffect(() => {
    loadVideos(pageNumber)
  }, [pageNumber])


  function onChangeSearchParams<A, B extends VideoSearchParamName>(
    videoSearchParameter: VideoSearchParameter<A, B>,
  ): (value: A) => void {
    return onChange(videoSearchParameter.name, videoSearchParameter.encoder.encode)
  }

  function onChange<A>(name: string, encoder: (value: A) => string): (value: A) => void {
    return (value: A) => {
      abortController.current = new AbortController()
      updateQueryParameter(name, encoder, value)
    }
  }

  function updateQueryParameter<A>(name: string, encoder: (value: A) => string, value: A) {
    queryParams.set(name, encoder(value))
    setQueryParams(queryParams)
  }

  const loadMore = () => {
    if (!isLoading.current) {
      isLoading.current = true
      setPageNumber(pageNumber => pageNumber + 1)
    }
  }

  return (
    <div className={styles.videosPage}>
      <Helmet title="Videos"/>
      <VideoSearch
        videoTitles={videos.map((video) => video.videoMetadata.title).slice(0, 10)}
        searchTerm={searchTerm}
        onSearchTermChange={onChangeSearchParams(SearchTermSearchParam)}
        sortBy={sortBy}
        onSortByChange={onChangeSearchParams(SortBySearchParam)}
        durationRange={durationRange}
        onDurationRangeChange={onChangeSearchParams(DurationRangeSearchParam)}
        sizeRange={sizeRange}
        onSizeRangeChange={onChangeSearchParams(SizeRangeSearchParam)}
        videoSites={videoSites}
        onVideoSitesChange={onChangeSearchParams(VideoSitesSearchParam)}
        ordering={ordering}
        onOrderingChange={onChangeSearchParams(OrderingSearchParam)}
        isLoading={isLoading.current}
      />

      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore.current}
        className={styles.videosList}>
        {
          videos.map(
              (video, index) =>
                <div key={index} className={styles.videoCard}>
                    <Link to={`/video/${video.videoMetadata.id}`}>
                      <VideoCard video={video}/>
                    </Link>
                </div>
          )
        }
      </InfiniteScroll>

    </div>
  )
}

function parseSearchParamsMemo<A, B extends VideoSearchParamName>(
  urlSearchParams: URLSearchParams,
  videoSearchParameter: VideoSearchParameter<A, B>
): A {
  return useMemo(() => parseSearchParam(urlSearchParams, videoSearchParameter), [urlSearchParams, videoSearchParameter])
}

export default Videos
