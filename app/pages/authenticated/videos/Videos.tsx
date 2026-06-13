import React, { useMemo, useState } from "react"
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
import { usePaginatedFetch } from "~/components/infinite-scroll/usePaginatedFetch"
import type { Ordering } from "~/models/Ordering"
import Helmet from "~/components/helmet/Helmet"

const PAGE_SIZE = 50

const Videos = () => {
  const [queryParams, setQueryParams] = useSearchParams()

  const [videos, setVideos] = useState<Video[]>([])
  const videoSites: string[] = useParsedSearchParam(queryParams, VideoSitesSearchParam)
  const sortBy: SortBy = useParsedSearchParam(queryParams, SortBySearchParam)
  const searchTerm: Option<string> = useParsedSearchParam(queryParams, SearchTermSearchParam)
  const durationRange: DurationRange = useParsedSearchParam(queryParams, DurationRangeSearchParam)
  const sizeRange: Range<number> = useParsedSearchParam(queryParams, SizeRangeSearchParam)
  const ordering: Ordering = useParsedSearchParam(queryParams, OrderingSearchParam)

  const { isLoading, hasMore, loadMore } = usePaginatedFetch<Video>(
    (pageNumber, signal) =>
      searchVideos(searchTerm, durationRange, sizeRange, videoSites, pageNumber, PAGE_SIZE, sortBy, ordering, signal)
        .then(result => result.results),
    (results, pageNumber) =>
      setVideos(videos => (pageNumber === 0 ? results : videos.concat(results))),
    { pageSize: PAGE_SIZE, resetDeps: [videoSites, sortBy, searchTerm, durationRange, sizeRange, ordering] }
  )

  function onChangeSearchParams<A, B extends VideoSearchParamName>(
    videoSearchParameter: VideoSearchParameter<A, B>,
  ): (value: A) => void {
    return onChange(videoSearchParameter.name, videoSearchParameter.encoder.encode)
  }

  function onChange<A>(name: string, encoder: (value: A) => string): (value: A) => void {
    return (value: A) => {
      queryParams.set(name, encoder(value))
      setQueryParams(queryParams)
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
        isLoading={isLoading}
      />

      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore}
        className={styles.videosList}>
        {
          videos.map(
              (video) =>
                <div key={video.videoMetadata.id} className={styles.videoCard}>
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

function useParsedSearchParam<A, B extends VideoSearchParamName>(
  urlSearchParams: URLSearchParams,
  videoSearchParameter: VideoSearchParameter<A, B>
): A {
  return useMemo(() => parseSearchParam(urlSearchParams, videoSearchParameter), [urlSearchParams, videoSearchParameter])
}

export default Videos
