import React, { type FC, useState, useEffect, useRef } from "react"
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
  const [isLoading, setIsLoading] = useState(false)
  const [addingVideoId, setAddingVideoId] = useState<Option<string>>(None.of())
  const [pageNumber, setPageNumber] = useState(0)

  const abortControllerRef = useRef<AbortController | null>(null)
  const hasMore = useRef(true)
  const isLoadingMore = useRef(false)
  const fetchedPages = useRef(new Set<number>())

  const loadVideos = async (page: number, isNewSearch: boolean) => {
    if (fetchedPages.current.has(page) && !isNewSearch) {
      return
    }

    if (abortControllerRef.current && isNewSearch) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    if (isNewSearch) {
      setIsLoading(true)
    }

    try {
      fetchedPages.current.add(page)

      const result = await searchVideos(
        searchTerm,
        durationRange,
        sizeRange,
        videoSites,
        page,
        PAGE_SIZE,
        sortBy,
        ordering,
        abortController.signal
      )

      if (result.results.length < PAGE_SIZE) {
        hasMore.current = false
      }

      if (isNewSearch) {
        setVideos(result.results)
      } else {
        setVideos(prev => [...prev, ...result.results])
      }
    } catch (error) {
      if ((error as Error).name !== "CanceledError") {
        console.error("Search error:", error)
      }
      fetchedPages.current.delete(page)
    } finally {
      setIsLoading(false)
      isLoadingMore.current = false
    }
  }

  // Initial search and search param changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset pagination state for new search
      setPageNumber(0)
      setVideos([])
      hasMore.current = true
      fetchedPages.current = new Set<number>()
      loadVideos(0, true)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, sortBy, ordering, durationRange, sizeRange, videoSites])

  // Load more pages
  useEffect(() => {
    if (pageNumber > 0) {
      loadVideos(pageNumber, false)
    }
  }, [pageNumber])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const loadMore = () => {
    if (!isLoadingMore.current && hasMore.current && !isLoading) {
      isLoadingMore.current = true
      setPageNumber(prev => prev + 1)
    }
  }

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
          hasMore={hasMore.current}
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
          {isLoadingMore.current && (
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
