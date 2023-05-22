import React, { useEffect, useState } from "react"
import { Either, Maybe, None, Some } from "monet"
import { Map } from "immutable"
import {
  deleteScheduledVideoById,
  fetchScheduledVideoById,
  fetchScheduledVideos,
  scheduledVideoDownloadStream,
} from "services/scheduling/SchedulingService"
import { EventStreamEventType } from "./EventStreamEventType"
import ScheduledVideoDownloadCard from "./scheduled-video-download-card/ScheduledVideoDownloadCard"
import ScheduledVideoDownload from "models/ScheduledVideoDownload"
import { Moment } from "moment"
import { DownloadProgress } from "models/DownloadProgress"
import { parseDownloadProgress } from "utils/ResponseParser"
import { SortBy } from "models/SortBy"
import styles from "./ScheduledVideos.module.css"
import { ImageList, ImageListItem } from "@material-ui/core"
import { Ordering } from "../../../models/Ordering"

const DOWNLOAD_HISTORY_SIZE = 10

export type BytesPerSecond = number

export interface Downloadable {
  downloadedBytes: number
  lastUpdatedAt: Maybe<Moment>
  downloadHistory: BytesPerSecond[]
  downloadSpeed: Maybe<BytesPerSecond>
}

const average = (numbers: number[]): Maybe<number> =>
  numbers
    .reduce<Maybe<number>>((acc, value) => Some(acc.getOrElse(0) + value), None())
    .map((total) => total / numbers.length)

const ScheduledVideos = () => {
  const [scheduledVideoDownloads, setScheduledVideoDownloads] = useState<
    Map<string, ScheduledVideoDownload & Downloadable>
  >(Map<string, ScheduledVideoDownload & Downloadable>())

  const columns = () => Math.ceil(document.body.clientWidth / 500)

  const [columnCount, setColumnCount] = useState<number>(columns())

  useEffect(() => {
    const onWindowResize = () => { setColumnCount(columns()) }

    window.addEventListener("resize", onWindowResize)

    return () => window.removeEventListener("resize", onWindowResize)
  })

  useEffect(() => {
    fetchScheduledVideos(None(), 0, 250, SortBy.Date, Ordering.Ascending).then((results) =>
      setScheduledVideoDownloads((scheduledVideoDownloads) =>
        scheduledVideoDownloads.concat(
          Map(
            results.map((scheduledVideoDownload) => [
              scheduledVideoDownload.videoMetadata.id,
              {
                ...scheduledVideoDownload,
                downloadSpeed: None(),
                lastUpdatedAt: None(),
                downloadHistory: [],
              },
            ])
          )
        )
      )
    )
  }, [])

  const onMessageEvent = (messageEvent: Event) => {
    const { data } = messageEvent as unknown as { data: string }

    Either.fromTry(() => JSON.parse(data)).fold(
      (error) => console.error(error),
      (json) => {
        const downloadProgress: DownloadProgress = parseDownloadProgress(json)

        fetchScheduledVideoById(downloadProgress.videoId).then((scheduledVideoDownload) => {
          setScheduledVideoDownloads((scheduledVideoDownloads) => {
            const downloadHistory = Maybe.fromFalsy(scheduledVideoDownloads.get(downloadProgress.videoId))
              .map((existing) => {
                const maybeCurrentRate = existing.lastUpdatedAt
                  .filter((lastUpdatedAt) => downloadProgress.updatedAt.valueOf() > lastUpdatedAt.valueOf())
                  .map(
                    (lastUpdatedAt) =>
                      (1000 * Math.max(downloadProgress.bytes - existing.downloadedBytes, 0)) /
                      (downloadProgress.updatedAt.valueOf() - lastUpdatedAt.valueOf())
                  )

                return existing.downloadHistory
                  .concat(maybeCurrentRate.filter((rate) => rate !== 0).fold<BytesPerSecond[]>([])((value) => [value]))
                  .slice(-1 * DOWNLOAD_HISTORY_SIZE)
              })
              .getOrElse([])

            return scheduledVideoDownloads.set(scheduledVideoDownload.videoMetadata.id, {
              ...scheduledVideoDownload,
              downloadedBytes: downloadProgress.bytes,
              lastUpdatedAt: Some(downloadProgress.updatedAt),
              downloadSpeed: average(downloadHistory),
              downloadHistory,
            })
          })
        })
      }
    )
  }

  useEffect(() => {
    const downloadStream = scheduledVideoDownloadStream()

    downloadStream.addEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, onMessageEvent)

    return () => {
      downloadStream.removeEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, onMessageEvent)
      downloadStream.close()
    }
  }, [])

  return (
    <div className={styles.scheduledVideos}>
      <ImageList cols={columnCount} rowHeight="auto">
        {scheduledVideoDownloads
          .sortBy((value) => value.scheduledAt.unix())
          .map((scheduledVideoDownload, index) => (
            <ImageListItem cols={1} key={index}>
              <ScheduledVideoDownloadCard
                scheduledVideoDownload={scheduledVideoDownload}
                onDelete={(videoId) =>
                  deleteScheduledVideoById(videoId).then(() =>
                    setScheduledVideoDownloads((scheduledVideos) => scheduledVideos.delete(videoId))
                  )
                }
              />
            </ImageListItem>
          ))
          .toList()}
      </ImageList>
    </div>
  )
}

export default ScheduledVideos
