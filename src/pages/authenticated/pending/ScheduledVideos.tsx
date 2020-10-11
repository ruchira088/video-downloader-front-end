import React, {useEffect, useState} from "react"
import {Either, Maybe, None, Some} from "monet"
import {Map} from "immutable"
import {
    fetchScheduledVideoById,
    fetchScheduledVideos,
    scheduledVideoDownloadStream,
} from "services/scheduling/SchedulingService"
import {EventStreamEventType} from "./EventStreamEventType"
import ScheduledVideoDownloadCard from "./scheduled-video-download-card/ScheduledVideoDownloadCard"
import ScheduledVideoDownload from "models/ScheduledVideoDownload"
import {Moment} from "moment"
import {DownloadProgress} from "models/DownloadProgress"
import {parseDownloadProgress} from "utils/ResponseParser"
import {SortBy} from "models/SortBy";

const DOWNLOAD_HISTORY_SIZE = 20

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

export default () => {
  const [scheduledVideoDownloads, setScheduledVideoDownloads] = useState<
    Map<string, ScheduledVideoDownload & Downloadable>
  >(Map())

  useEffect(() => {
    fetchScheduledVideos(None(), 0, 100, SortBy.Date).then((results) =>
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

  useEffect(() => {
    const downloadStream = scheduledVideoDownloadStream()

    downloadStream.addEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, (messageEvent) => {
      const { data } = (messageEvent as unknown) as { data: string }

      Either.fromTry(() => JSON.parse(data)).fold(
        (error) => console.error(error),
        (json) => {
          const downloadProgress: DownloadProgress = parseDownloadProgress(json)

          fetchScheduledVideoById(downloadProgress.videoId).then((scheduledVideoDownload) => {
            setScheduledVideoDownloads((scheduledVideoDownloads) => {
              const downloadHistory = Maybe.fromFalsy(scheduledVideoDownloads.get(downloadProgress.videoId))
                .map((existing) => {
                  const currentRate = existing.lastUpdatedAt.map(
                    (lastUpdatedAt) =>
                      (1000 * (downloadProgress.bytes - existing.downloadedBytes)) /
                      (downloadProgress.updatedAt.valueOf() - lastUpdatedAt.valueOf())
                  )

                  return existing.downloadHistory
                    .concat(currentRate.fold<BytesPerSecond[]>([])((value) => [value]))
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
    })

    return () => {
      downloadStream.removeEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, ((() => {}) as unknown) as EventListener)
      downloadStream.close()
    }
  }, [])

  return (
    <>
      {scheduledVideoDownloads
        .sortBy((value) => -1 * value.scheduledAt.unix())
        .map((scheduledVideoDownload, index) => <ScheduledVideoDownloadCard {...scheduledVideoDownload} key={index} />)
        .toList()}
    </>
  )
}
