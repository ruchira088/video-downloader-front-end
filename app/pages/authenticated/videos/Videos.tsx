import React, { useEffect, useMemo, useState } from "react"
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
import { Link, type NavigateOptions, useSearchParams } from "react-router"
import type { Option } from "~/types/Option"
import { maybeString } from "~/utils/StringUtils"
import { useDebouncedValue } from "~/hooks/useDebouncedValue"
import VideoCard from "~/components/video/video-card/VideoCard"

import styles from "./Videos.module.scss"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import { usePaginatedFetch } from "~/components/infinite-scroll/usePaginatedFetch"
import type { Ordering } from "~/models/Ordering"
import Helmet from "~/components/helmet/Helmet"

const PAGE_SIZE = 50
const SEARCH_DEBOUNCE_MS = 350

const Videos = () => {
  const [queryParams, setQueryParams] = useSearchParams()

  const [videos, setVideos] = useState<Video[]>([])
  const videoSites: string[] = useParsedSearchParam(queryParams, VideoSitesSearchParam)
  const sortBy: SortBy = useParsedSearchParam(queryParams, SortBySearchParam)
  const searchTerm: Option<string> = useParsedSearchParam(queryParams, SearchTermSearchParam)
  const durationRange: DurationRange = useParsedSearchParam(queryParams, DurationRangeSearchParam)
  const sizeRange: Range<number> = useParsedSearchParam(queryParams, SizeRangeSearchParam)
  const ordering: Ordering = useParsedSearchParam(queryParams, OrderingSearchParam)

  // The text field is driven locally and only written to the URL once typing settles, so a
  // search costs one request and one history entry instead of one of each per keystroke.
  const searchTermValue = searchTerm.getOrElse(() => "")
  const [searchInput, setSearchInput] = useState(searchTermValue)
  const debouncedSearchInput = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)

  // Adopt the URL's value when it changes from outside the field (back/forward, a shared link).
  useEffect(() => {
    setSearchInput(searchTermValue)
  }, [searchTermValue])

  const { isLoading, hasMore, loadMore, hasError, retry } = usePaginatedFetch<Video>(
    (pageNumber, signal) =>
      searchVideos(searchTerm, durationRange, sizeRange, videoSites, pageNumber, PAGE_SIZE, sortBy, ordering, signal)
        .then(result => result.results),
    (results, pageNumber) =>
      setVideos(videos => (pageNumber === 0 ? results : videos.concat(results))),
    { pageSize: PAGE_SIZE, resetDeps: [videoSites, sortBy, searchTerm, durationRange, sizeRange, ordering] }
  )

  function onChangeSearchParams<A, B extends VideoSearchParamName>(
    videoSearchParameter: VideoSearchParameter<A, B>,
    navigateOptions?: NavigateOptions
  ): (value: A) => void {
    return onChange(
      videoSearchParameter.name,
      value => videoSearchParameter.encoder.encode(value),
      navigateOptions
    )
  }

  function onChange<A>(
    name: string,
    encoder: (value: A) => string,
    navigateOptions?: NavigateOptions
  ): (value: A) => void {
    return (value: A) => {
      // Copy rather than mutate: `queryParams` is router-owned state, and the parsed values
      // above are memoised on its identity, so mutating it in place hides the change.
      const updatedQueryParams = new URLSearchParams(queryParams)
      const encodedValue = encoder(value)

      if (encodedValue === "") {
        updatedQueryParams.delete(name)
      } else {
        updatedQueryParams.set(name, encodedValue)
      }

      setQueryParams(updatedQueryParams, navigateOptions)
    }
  }

  // Searching replaces the current entry: typing a query should not bury the previous page
  // under one history entry per settled keystroke.
  const onSearchTermChange = onChangeSearchParams(SearchTermSearchParam, { replace: true })

  useEffect(() => {
    if (debouncedSearchInput !== searchTermValue) {
      onSearchTermChange(maybeString(debouncedSearchInput))
    }
    // Guarded by the equality check above, so re-running on an unstable `onSearchTermChange`
    // identity is a no-op rather than a loop.
  }, [debouncedSearchInput, searchTermValue, onSearchTermChange])

  return (
    <div className={styles.videosPage}>
      <Helmet title="Videos"/>
      <VideoSearch
        videoTitles={videos.map((video) => video.videoMetadata.title).slice(0, 10)}
        searchTerm={maybeString(searchInput)}
        onSearchTermChange={(value: Option<string>) => setSearchInput(value.getOrElse(() => ""))}
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
        isLoading={isLoading}
        hasError={hasError}
        onRetry={retry}
        endMessage={videos.length > 0 ? "No more videos" : "No videos found"}
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
