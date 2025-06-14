import React, {useEffect, useRef, useState} from "react"
import {Map} from "immutable"
import {
  deleteScheduledVideoById,
  fetchScheduledVideos,
  retryFailedScheduledVideos,
  scheduledVideoDownloadStream,
  updateSchedulingStatus
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
import {SchedulingStatus} from "~/models/SchedulingStatus"
import {ScheduledVideoDownload} from "~/models/ScheduledVideoDownload"
import Helmet from "~/components/helmet/Helmet"
import {scanForVideos} from "~/services/video/VideoService"

const DOWNLOAD_HISTORY_SIZE = 10
const PAGE_SIZE = 50

const average = (numbers: number[]): Option<number> =>
  numbers
    .reduce<Option<number>>((acc, value) => Some.of(acc.getOrElse(() => 0) + value), None.of())
    .map((total) => total / numbers.length)

const gatherDownloadHistory =
  (downloadProgress: DownloadProgress, scheduledVideoDownload: DownloadableScheduledVideo): number[] => {
    if (downloadProgress.updatedAt.toMillis() > scheduledVideoDownload.lastUpdatedAt.toMillis()) {
      const downloadRate =
        (1000 * Math.max(downloadProgress.bytes - scheduledVideoDownload.downloadedBytes, 0)) /
        (downloadProgress.updatedAt.toMillis() - scheduledVideoDownload.lastUpdatedAt.toMillis())

      return scheduledVideoDownload.downloadHistory.concat(downloadRate).slice(-DOWNLOAD_HISTORY_SIZE)
    } else {
      return scheduledVideoDownload.downloadHistory
    }
  }

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

  const onDownloadProgress = (downloadProgress: DownloadProgress) =>
    setDownloadableScheduledVideos(scheduledVideoDownloads =>
      Option.fromNullable(scheduledVideoDownloads.get(downloadProgress.videoId))
        .fold<Map<string, DownloadableScheduledVideo>>(
          () => scheduledVideoDownloads,
          scheduledVideoDownload => {
            const downloadHistory = gatherDownloadHistory(downloadProgress, scheduledVideoDownload)
            return scheduledVideoDownloads.set(downloadProgress.videoId, {
              ...scheduledVideoDownload,
              downloadedBytes: downloadProgress.bytes,
              lastUpdatedAt: downloadProgress.updatedAt,
              downloadSpeed: average(downloadHistory),
              downloadHistory
            })
          }
        )
    )

  const onScheduledVideoDownloadUpdate = (scheduledVideoDownload: ScheduledVideoDownload) =>
    setDownloadableScheduledVideos(downloadableScheduledVideos => {
      if ([SchedulingStatus.Completed, SchedulingStatus.Deleted].includes(scheduledVideoDownload.status)) {
        return downloadableScheduledVideos.delete(scheduledVideoDownload.videoMetadata.id)
      } else {
        return downloadableScheduledVideos.set(
          scheduledVideoDownload.videoMetadata.id,
          {
            ...scheduledVideoDownload,
            downloadSpeed: None.of(),
            downloadHistory: []
          }
        )
      }
    })


  useEffect(() => {
    return scheduledVideoDownloadStream(onDownloadProgress, onScheduledVideoDownloadUpdate)
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
    } finally {
      setDisableRetry(false)
    }
  }

  const onDelete = (videoId: string) => () => deleteScheduledVideoById(videoId)

  const onUpdateStatus = (videoId: string) => async (schedulingStatus: SchedulingStatus) => {
    const scheduledVideoDownload = await updateSchedulingStatus(videoId, schedulingStatus)

    setDownloadableScheduledVideos((downloadableScheduledVideos) =>
      downloadableScheduledVideos.set(videoId, {
        ...scheduledVideoDownload,
        downloadSpeed: None.of(),
        downloadHistory: []
      })
    )
  }

  return (
    <div className={styles.scheduledVideos}>
      <Helmet title="Downloding Videos"/>
      <div className={styles.buttonContainer}>
        <Button variant="contained" onClick={() => scanForVideos()} className={styles.scanForVideos}>
          Scan For Videos
        </Button>
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
                      onDelete={onDelete(downloadableScheduledVideos.videoMetadata.id)}
                      onUpdateStatus={onUpdateStatus(downloadableScheduledVideos.videoMetadata.id)}/>
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
