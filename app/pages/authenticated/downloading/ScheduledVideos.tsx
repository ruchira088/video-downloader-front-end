import React, {useEffect, useRef, useState} from "react"
import {Map} from "immutable"
import {
  deleteScheduledVideoById,
  fetchScheduledVideoById,
  fetchScheduledVideos,
  retryFailedScheduledVideos,
  scheduledVideoDownloadStream
} from "~/services/scheduling/SchedulingService"
import ScheduledVideoDownloadCard from "./scheduled-video-download-card/ScheduledVideoDownloadCard"
import {DownloadProgress} from "~/models/DownloadProgress"
import {SortBy} from "~/models/SortBy"
import styles from "./ScheduledVideos.module.css"
import {Ordering} from "~/models/Ordering"
import {None, Option, Some} from "~/types/Option"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import {Button} from "@mui/material"
import type {DownloadableScheduledVideo} from "~/models/DownloadableScheduledVideo"

const DOWNLOAD_HISTORY_SIZE = 10
const PAGE_SIZE = 25

const average = (numbers: number[]): Option<number> =>
  numbers
    .reduce<Option<number>>((acc, value) => Some.of(acc.getOrElse(() => 0) + value), None.of())
    .map((total) => total / numbers.length)

const gatherDownloadHistory =
  (downloadProgress: DownloadProgress, scheduledVideoDownloads: Map<string, DownloadableScheduledVideo>): number[] =>
    Option.fromNullable(scheduledVideoDownloads.get(downloadProgress.videoId))
      .map((existing) => {
        const maybeCurrentRate = existing.lastUpdatedAt
          .filter((lastUpdatedAt) => downloadProgress.updatedAt.toMillis() > lastUpdatedAt.toMillis())
          .map(
            (lastUpdatedAt) =>
              (1000 * Math.max(downloadProgress.bytes - existing.downloadedBytes, 0)) /
              (downloadProgress.updatedAt.toMillis() - lastUpdatedAt.toMillis())
          )

        return existing.downloadHistory
          .concat(maybeCurrentRate.filter((rate) => rate !== 0).fold<number[]>(() => [], (value) => [value]))
          .slice(-1 * DOWNLOAD_HISTORY_SIZE)
      })
      .getOrElse(() => [])

const ScheduledVideos = () => {
  const [downloadableScheduledVideos, setDownloadableScheduledVideos] =
    useState(Map<string, DownloadableScheduledVideo>())

  const [pageNumber, setPageNumber] = useState(0)
  const [disableRetry, setDisableRetry] = useState(false)
  const hasMore = useRef(true)
  const isLoading = useRef(false)

  const retrieveScheduledVideos = async () => {
    isLoading.current = true

    try {
      const scheduledVideos = await fetchScheduledVideos(None.of(), pageNumber, PAGE_SIZE, SortBy.Date, Ordering.Ascending)

      if (scheduledVideos.length < PAGE_SIZE) {
        hasMore.current = false
      }

      const downloadableScheduledVideoMap: Map<string, DownloadableScheduledVideo> = Map(
        scheduledVideos.map((scheduledVideoDownload) => [
          scheduledVideoDownload.videoMetadata.id,
          {
            ...scheduledVideoDownload,
            downloadSpeed: None.of(),
            lastUpdatedAt: None.of(),
            downloadHistory: []
          }
        ])
      )

      setDownloadableScheduledVideos((downloadableScheduledVideos) =>
        downloadableScheduledVideos.concat(downloadableScheduledVideoMap)
      )
    } finally {
      isLoading.current = false
    }
  }

  useEffect(() => {
    retrieveScheduledVideos()
  }, [pageNumber])

  const onDownloadProgress = async (downloadProgress: DownloadProgress) => {
    const scheduledVideoDownload = await fetchScheduledVideoById(downloadProgress.videoId)

    const updateScheduledVideoDownloads = (scheduledVideoDownloads: Map<string, DownloadableScheduledVideo>) => {
      const downloadHistory = gatherDownloadHistory(downloadProgress, scheduledVideoDownloads)

      return scheduledVideoDownloads.set(scheduledVideoDownload.videoMetadata.id, {
        ...scheduledVideoDownload,
        downloadedBytes: downloadProgress.bytes,
        lastUpdatedAt: Some.of(downloadProgress.updatedAt),
        downloadSpeed: average(downloadHistory),
        downloadHistory
      })
    }

    setDownloadableScheduledVideos(updateScheduledVideoDownloads)
  }

  useEffect(() => {
    return scheduledVideoDownloadStream(onDownloadProgress)
  }, [])

  const loadMore = () => {
    if (!isLoading.current) {
      isLoading.current = true
      setPageNumber(pageNumber => pageNumber + 1)
    }
  }

  const retryAll = async () => {
    setDisableRetry(true)

    try {
      await retryFailedScheduledVideos()
      isLoading.current = false
      hasMore.current = true
      setPageNumber(0)
      setDownloadableScheduledVideos(Map())
    } finally {
      setDisableRetry(false)
    }
  }

  const onDelete = async (videoId: string) => {
    await deleteScheduledVideoById(videoId)
    setDownloadableScheduledVideos((downloadableScheduledVideos) => downloadableScheduledVideos.delete(videoId))
  }

  return (
    <div className={styles.scheduledVideos}>
      {/*<Helmet>*/}
      {/*  <title>Pending Videos</title>*/}
      {/*</Helmet>*/}
      <div className={styles.buttonContainer}>
        <Button
          onClick={retryAll}
          disabled={disableRetry}
          className={styles.retryAll}
          variant="contained">
          Retry All
        </Button>
      </div>
      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore.current}
        className={styles.scheduledVideoGallery}
      >
        {
          downloadableScheduledVideos
            .sortBy((value) => value.scheduledAt.toMillis())
            .toList()
            .toArray().concat(Array(10).fill(null))
            .map((downloadableScheduledVideos, index) => (
                <div key={index} className={styles.scheduledVideoCard}>
                  {downloadableScheduledVideos != null &&
                    <ScheduledVideoDownloadCard
                      downloadableScheduledVideo={downloadableScheduledVideos}
                      onDelete={onDelete}
                    />
                  }
                </div>
              )
            )
        }
      </InfiniteScroll>
    </div>
  )
}

export default ScheduledVideos
