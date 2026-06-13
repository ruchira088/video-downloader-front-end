import React, { type FC, useState, useEffect } from "react"
import { CircularProgress } from "@mui/material"
import { Video } from "~/models/Video"
import { searchVideos } from "~/services/video/VideoService"
import { SortBy } from "~/models/SortBy"
import { Ordering } from "~/models/Ordering"
import { None, Some, type Option } from "~/types/Option"
import { Duration } from "luxon"
import { type DurationRange } from "~/models/DurationRange"
import { type Range } from "~/models/Range"
import VideoSearch from "~/pages/authenticated/videos/components/VideoSearch"
import DraggableSearchVideoCard from "./DraggableSearchVideoCard"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import { usePaginatedFetch } from "~/components/infinite-scroll/usePaginatedFetch"

import styles from "./VideoSearchPanel.module.scss"

const DEFAULT_DURATION_RANGE: DurationRange = {
  min: Duration.fromObject({ seconds: 0 }),
  max: None.of<Duration>()
}

const DEFAULT_SIZE_RANGE: Range<number> = {
  min: 0,
  max: None.of<number>()
}

const PAGE_SIZE = 20

const SEARCH_DEBOUNCE_MS = 300

// Trails the given value by `delayMs`, so rapid changes (e.g. typing) only
// produce one update once the input settles.
function useDebouncedValue<A>(value: A, delayMs: number): A {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}

type VideoSearchPanelProps = {
  readonly onVideoSelect: (videoId: string) => Promise<void>
  readonly existingVideoIds: string[]
}

const VideoSearchPanel: FC<VideoSearchPanelProps> = ({ onVideoSelect, existingVideoIds }) => {
  const [searchTerm, setSearchTerm] = useState<Option<string>>(None.of())
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.Date)
  const [ordering, setOrdering] = useState<Ordering>(Ordering.Descending)
  const [durationRange, setDurationRange] = useState<DurationRange>(DEFAULT_DURATION_RANGE)
  const [sizeRange, setSizeRange] = useState<Range<number>>(DEFAULT_SIZE_RANGE)
  const [videoSites, setVideoSites] = useState<string[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [addingVideoId, setAddingVideoId] = useState<Option<string>>(None.of())

  const debouncedSearchTerm = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS)

  const { isLoading, hasMore, loadMore } = usePaginatedFetch<Video>(
    (pageNumber, signal) =>
      searchVideos(
        debouncedSearchTerm,
        durationRange,
        sizeRange,
        videoSites,
        pageNumber,
        PAGE_SIZE,
        sortBy,
        ordering,
        signal
      ).then(result => result.results),
    (results, pageNumber) =>
      setVideos(videos => (pageNumber === 0 ? results : videos.concat(results))),
    {
      pageSize: PAGE_SIZE,
      resetDeps: [debouncedSearchTerm, sortBy, ordering, durationRange, sizeRange, videoSites]
    }
  )

  const handleAddVideo = async (videoId: string) => {
    setAddingVideoId(Some.of(videoId))
    try {
      await onVideoSelect(videoId)
    } finally {
      setAddingVideoId(None.of())
    }
  }

  const filteredVideos = videos.filter(
    video => !existingVideoIds.includes(video.videoMetadata.id)
  )

  return (
    <div className={styles.videoSearchPanel}>
      <VideoSearch
        videoTitles={videos.map(video => video.videoMetadata.title).slice(0, 10)}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        durationRange={durationRange}
        onDurationRangeChange={setDurationRange}
        sizeRange={sizeRange}
        onSizeRangeChange={setSizeRange}
        videoSites={videoSites}
        onVideoSitesChange={setVideoSites}
        ordering={ordering}
        onOrderingChange={setOrdering}
        isLoading={isLoading}
      />

      {isLoading && videos.length === 0 && (
        <div className={styles.loadingContainer}>
          <CircularProgress size={24} />
        </div>
      )}

      {filteredVideos.length > 0 && (
        <InfiniteScroll
          loadMore={loadMore}
          hasMore={hasMore}
          className={styles.results}
        >
          <p className={styles.resultsHint}>
            Click + to add videos to playlist
          </p>
          {filteredVideos.map(video => {
            const videoId = video.videoMetadata.id
            const isAdding = addingVideoId
              .map(id => id === videoId)
              .getOrElse(() => false)

            return (
              <DraggableSearchVideoCard
                key={videoId}
                video={video}
                onAdd={() => handleAddVideo(videoId)}
                isAdding={isAdding}
              />
            )
          })}
          {isLoading && (
            <div className={styles.loadingMore}>
              <CircularProgress size={20} />
            </div>
          )}
        </InfiniteScroll>
      )}

      {!isLoading && filteredVideos.length === 0 && videos.length > 0 && (
        <div className={styles.noResults}>All videos already in playlist</div>
      )}
    </div>
  )
}

export default VideoSearchPanel
