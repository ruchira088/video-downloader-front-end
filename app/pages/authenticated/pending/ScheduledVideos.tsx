import React, { useEffect, useState } from "react"
import { Map } from "immutable"
import {
  deleteScheduledVideoById,
  fetchScheduledVideoById,
  fetchScheduledVideos,
  scheduledVideoDownloadStream
} from "~/services/scheduling/SchedulingService"
import ScheduledVideoDownloadCard from "./scheduled-video-download-card/ScheduledVideoDownloadCard"
import { ScheduledVideoDownload } from "~/models/ScheduledVideoDownload"
import { DownloadProgress } from "~/models/DownloadProgress"
import { SortBy } from "~/models/SortBy"
import styles from "./ScheduledVideos.module.css"
import { ImageList, ImageListItem } from "@mui/material"
import { Ordering } from "~/models/Ordering"
import { None, Option, Some } from "~/types/Option"
import type { DateTime } from "luxon"

const DOWNLOAD_HISTORY_SIZE = 10

export type BytesPerSecond = number

export interface Downloadable {
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
  (downloadProgress: DownloadProgress, scheduledVideoDownloads: Map<string, ScheduledVideoDownload & Downloadable>) =>
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

const ScheduledVideos = () => {
  const [scheduledVideoDownloads, setScheduledVideoDownloads] =
    useState(Map<string, ScheduledVideoDownload & Downloadable>())

  const columns = () => Math.ceil(document.body.clientWidth / 500)

  const [columnCount, setColumnCount] = useState<number>(columns())

  useEffect(() => {
    const onWindowResize = () => { setColumnCount(columns()) }

    window.addEventListener("resize", onWindowResize)

    return () => window.removeEventListener("resize", onWindowResize)
  })

  useEffect(() => {
    fetchScheduledVideos(None.of(), 0, 250, SortBy.Date, Ordering.Ascending).then((results) =>
      setScheduledVideoDownloads((scheduledVideoDownloads) =>
        scheduledVideoDownloads.concat(
          Map(
            results.map((scheduledVideoDownload) => [
              scheduledVideoDownload.videoMetadata.id,
              {
                ...scheduledVideoDownload,
                downloadSpeed: None.of(),
                lastUpdatedAt: None.of(),
                downloadHistory: [],
              },
            ])
          )
        )
      )
    )
  }, [])

  const onDownloadProgress = async (downloadProgress: DownloadProgress) => {
    const scheduledVideoDownload = await fetchScheduledVideoById(downloadProgress.videoId)

    setScheduledVideoDownloads((scheduledVideoDownloads) => {
      const downloadHistory = gatherDownloadHistory(downloadProgress, scheduledVideoDownloads)

      return scheduledVideoDownloads.set(scheduledVideoDownload.videoMetadata.id, {
        ...scheduledVideoDownload,
        downloadedBytes: downloadProgress.bytes,
        lastUpdatedAt: Some.of(downloadProgress.updatedAt),
        downloadSpeed: average(downloadHistory),
        downloadHistory
      })
    })
  }

  useEffect(() => {
    return scheduledVideoDownloadStream(onDownloadProgress)
  }, [])

  return (
    <div className={styles.scheduledVideos}>
      {/*<Helmet>*/}
      {/*  <title>Pending Videos</title>*/}
      {/*</Helmet>*/}
      <ImageList cols={columnCount} rowHeight="auto">
        {scheduledVideoDownloads
          .sortBy((value) => value.scheduledAt.toMillis())
          .map((scheduledVideoDownload, index) => (
            <ImageListItem className={styles.imageListItem} cols={1} key={index}>
              <ScheduledVideoDownloadCard
                scheduledVideoDownload={scheduledVideoDownload}
                onDelete={(videoId) =>
                  deleteScheduledVideoById(videoId).then(() =>
                    setScheduledVideoDownloads((scheduledVideos) => scheduledVideos.delete(videoId))
                  )
                }
              />
              <a className={styles.sourceLink} href={scheduledVideoDownload.videoMetadata.url} target="_blank">Source</a>
            </ImageListItem>
          ))
          .toList()}
      </ImageList>
    </div>
  )
}

export default ScheduledVideos
