import React, {useEffect, useRef, useState} from "react"
import {searchVideos} from "~/services/video/VideoService"
import {Video} from "~/models/Video"
import {type SortBy} from "~/models/SortBy"
import {type DurationRange} from "~/models/DurationRange"
import VideoSearch from "./components/VideoSearch"
import {
  DurationRangeSearchParam, OrderingSearchParam,
  parseSearchParam,
  SearchTermSearchParam,
  SizeRangeSearchParam,
  SortBySearchParam,
  type VideoSearchParameter,
  VideoSearchParamName,
  VideoSitesSearchParam
} from "./components/VideoSearchParams"
import {Range} from "~/models/Range"
import {Link, useNavigate, useSearchParams} from "react-router"
import type {Option} from "~/types/Option"
import VideoCard from "~/components/video/video-card/VideoCard"

import styles from "./Videos.module.scss"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import type {Ordering} from "~/models/Ordering"

const PAGE_SIZE = 50

const Videos = () => {
  const [queryParams] = useSearchParams()
  const navigate = useNavigate()

  const [videos, setVideos] = useState<Video[]>([])
  const [videoSites, setVideoSites] = useState<string[]>(parseSearchParam(queryParams, VideoSitesSearchParam))
  const [sortBy, setSortBy] = useState<SortBy>(parseSearchParam(queryParams, SortBySearchParam))
  const [searchTerm, setSearchTerm] = useState<Option<string>>(parseSearchParam(queryParams, SearchTermSearchParam))
  const [durationRange, setDurationRange] = useState<DurationRange>(parseSearchParam(queryParams, DurationRangeSearchParam))
  const [sizeRange, setSizeRange] = useState<Range<number>>(parseSearchParam(queryParams, SizeRangeSearchParam))
  const [ordering, setOrdering] = useState<Ordering>(parseSearchParam(queryParams, OrderingSearchParam))
  const abortController = useRef(new AbortController())
  const [pageNumber, setPageNumber] = useState(0)
  const isLoading = useRef(false)
  const hasMore = useRef(true)
  const fetchedPages = useRef(new Set<number>())

  const loadVideos = async (): Promise<void> => {
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
    loadVideos()
  }, [videoSites, sortBy, searchTerm, durationRange, sizeRange, pageNumber, ordering])

  function onChangeSearchParams<A, B extends VideoSearchParamName>(
    videoSearchParameter: VideoSearchParameter<A, B>,
    f: (value: A) => void
  ): (value: A) => void {
    return onChange(videoSearchParameter.name, videoSearchParameter.encoder.encode, f)
  }

  function onChange<A>(name: string, encoder: (value: A) => string, f: (value: A) => void): (value: A) => void {
    return (value: A) => {
      abortController.current = new AbortController()
      f(value)
      updateQueryParameter(name, encoder, value)
      setPageNumber(0)
      setVideos([])
      fetchedPages.current = new Set<number>()
      hasMore.current =true
      isLoading.current = false
    }
  }

  function updateQueryParameter<A>(name: string, encoder: (value: A) => string, value: A) {
    queryParams.set(name, encoder(value))
    navigate({ search: queryParams.toString() })
  }

  const loadMore = () => {
    if (!isLoading.current) {
      isLoading.current = true
      setPageNumber(pageNumber => pageNumber + 1)
    }
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
        ordering={ordering}
        onOrderingChange={onChangeSearchParams(OrderingSearchParam, setOrdering)}
        isLoading={isLoading.current}
      />

      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore.current}
        className={styles.videosList}>
        {
          videos.concat(Array(10).fill(null)).map(
              (video, index) =>
                <div key={index} className={styles.videoCard}>
                  {
                    video != null &&
                    <Link to={`/video/${video.videoMetadata.id}`}>
                      <VideoCard video={video}/>
                    </Link>
                  }
                </div>
          )
        }
      </InfiniteScroll>

    </div>
  )
}

export default Videos
