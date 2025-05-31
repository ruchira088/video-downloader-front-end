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
import {ScheduledVideoDownload} from "~/models/ScheduledVideoDownload"
import {DownloadProgress} from "~/models/DownloadProgress"
import {SortBy} from "~/models/SortBy"
import styles from "./ScheduledVideos.module.css"
import {Ordering} from "~/models/Ordering"
import {None, Option, Some} from "~/types/Option"
import type {DateTime} from "luxon"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import {Button} from "@mui/material"

const DOWNLOAD_HISTORY_SIZE = 10
const PAGE_SIZE = 25

export type BytesPerSecond = number

export type Downloadable = {
  downloadedBytes: number
  lastUpdatedAt: Option<DateTime>
  downloadHistory: BytesPerSecond[]
  downloadSpeed: Option<BytesPerSecond>
}

const average = (numbers: number[]): Option<number> =>
  numbers
    .reduce<Option<number>>((acc, value) => Some.of(acc.getOrElse(() => 0) + value), None.of())
    .map((total) => total / numbers.length)

const gatherDownloadHistory =
  (downloadProgress: DownloadProgress, scheduledVideoDownloads: Map<string, ScheduledVideoDownload & Downloadable>): number[] =>
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
          .concat(maybeCurrentRate.filter((rate) => rate !== 0).fold<BytesPerSecond[]>(() => [], (value) => [value]))
          .slice(-1 * DOWNLOAD_HISTORY_SIZE)
      })
      .getOrElse(() => [])

type DownloadableScheduledVideo = ScheduledVideoDownload & Downloadable

const ScheduledVideos = () => {
  const [scheduledVideoDownloads, setScheduledVideoDownloads] =
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

      setScheduledVideoDownloads((scheduledVideoDownloads) => scheduledVideoDownloads.concat(downloadableScheduledVideoMap))
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

    setScheduledVideoDownloads(updateScheduledVideoDownloads)
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
      setScheduledVideoDownloads(Map())
    } finally {
      setDisableRetry(false)
    }
  }

  return (
    <div className={styles.scheduledVideos}>
      {/*<Helmet>*/}
      {/*  <title>Pending Videos</title>*/}
      {/*</Helmet>*/}
      <Button
        onClick={retryAll}
        disabled={disableRetry}
        variant="contained">
        Retry All Failed
      </Button>
      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore.current}
        className={styles.scheduledVideoGallery}
      >
        {
          scheduledVideoDownloads
            .sortBy((value) => value.scheduledAt.toMillis())
            .toList()
            .toArray().concat(Array(10).fill(null))
            .map((scheduledVideoDownload, index) => (
                <div key={index} className={styles.scheduledVideoCard}>
                  {scheduledVideoDownload != null &&
                    <div>
                      <ScheduledVideoDownloadCard
                        scheduledVideoDownload={scheduledVideoDownload}
                        onDelete={(videoId) =>
                          deleteScheduledVideoById(videoId).then(() =>
                            setScheduledVideoDownloads((scheduledVideos) => scheduledVideos.delete(videoId))
                          )
                        }
                      />
                      <a className={styles.sourceLink}
                         href={scheduledVideoDownload.videoMetadata.url}
                         target="_blank">
                        Source
                      </a>
                    </div>
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
