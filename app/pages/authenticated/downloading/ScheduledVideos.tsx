import React, {useEffect, useRef, useState} from "react"
import {Map, Set} from "immutable"
import {
  deleteScheduledVideoById,
  fetchScheduledVideos,
  retryFailedScheduledVideos,
  scheduledVideoDownloadStream,
  StreamConnection,
  updateSchedulingStatus
} from "~/services/scheduling/SchedulingService"
import ScheduledVideoDownloadCard from "./scheduled-video-download-card/ScheduledVideoDownloadCard"
import {DownloadProgress} from "~/models/DownloadProgress"
import {SortBy} from "~/models/SortBy"
import styles from "./ScheduledVideos.module.scss"
import {Ordering} from "~/models/Ordering"
import {None, Option, Some} from "~/types/Option"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import {usePaginatedFetch} from "~/components/infinite-scroll/usePaginatedFetch"
import VideoScanButton from "~/components/scan/VideoScanButton"
import {Alert, Button} from "@mui/material"
import type {DownloadableScheduledVideo} from "~/models/DownloadableScheduledVideo"
import {isFinishedStatus, SchedulingStatus} from "~/models/SchedulingStatus"
import {ScheduledVideoDownload} from "~/models/ScheduledVideoDownload"
import Helmet from "~/components/helmet/Helmet"
import {useNotification} from "~/providers/NotificationProvider"

const DOWNLOAD_HISTORY_SIZE = 10
const PAGE_SIZE = 50

const average = (numbers: number[]): Option<number> =>
  numbers.length === 0
    ? None.of()
    : Some.of(numbers.reduce((total, value) => total + value, 0) / numbers.length)

/** A freshly fetched or updated download has no progress samples yet, so its speed is unknown. */
const toDownloadable = (scheduledVideoDownload: ScheduledVideoDownload): DownloadableScheduledVideo => ({
  ...scheduledVideoDownload,
  downloadSpeed: None.of(),
  downloadHistory: []
})

/**
 * Applies an update that leaves the status unchanged (e.g. a rename or a persisted byte count)
 * without discarding the speed measured from the progress stream, which the server never sends.
 * The byte count comes from whichever is newer: the stream usually runs ahead of the database.
 */
const mergeUpdate = (
  existing: DownloadableScheduledVideo,
  scheduledVideoDownload: ScheduledVideoDownload
): DownloadableScheduledVideo => {
  const isUpdateNewer = scheduledVideoDownload.lastUpdatedAt.toMillis() > existing.lastUpdatedAt.toMillis()

  return {
    ...scheduledVideoDownload,
    downloadedBytes: isUpdateNewer ? scheduledVideoDownload.downloadedBytes : existing.downloadedBytes,
    lastUpdatedAt: isUpdateNewer ? scheduledVideoDownload.lastUpdatedAt : existing.lastUpdatedAt,
    downloadSpeed: existing.downloadSpeed,
    downloadHistory: existing.downloadHistory
  }
}

/** Applies a server copy of a download, keeping the measured speed when the status is unchanged. */
const applyUpdate = (
  existing: DownloadableScheduledVideo | undefined,
  scheduledVideoDownload: ScheduledVideoDownload
): DownloadableScheduledVideo =>
  Option.fromNullable(existing)
    .filter(current => current.status === scheduledVideoDownload.status)
    .fold(
      () => toDownloadable(scheduledVideoDownload),
      current => mergeUpdate(current, scheduledVideoDownload)
    )

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
  const {notifyError} = useNotification()

  const [downloadableScheduledVideos, setDownloadableScheduledVideos] =
    useState(Map<string, DownloadableScheduledVideo>())

  const [disableRetry, setDisableRetry] = useState(false)

  // None until the stream first opens, so the initial connect shows no banner.
  const [streamConnection, setStreamConnection] = useState<Option<StreamConnection>>(None.of())
  // Bumped to open a fresh stream after the browser gives up on the old one.
  const [streamKey, setStreamKey] = useState(0)
  // Bumped to reload the list from page 0, since events sent while disconnected are lost.
  const [reloadKey, setReloadKey] = useState(0)
  // Set when the stream drops, so the next successful connect reloads the list.
  const missedStreamEvents = useRef(false)

  // A page's snapshot can be older than what the stream has delivered since the list started
  // loading. These record that newer state so a landing page cannot overwrite it: ids the
  // stream reported finished, and ids it otherwise updated.
  const finishedVideoIds = useRef(Set<string>())
  const streamUpdatedVideoIds = useRef(Set<string>())

  const { isLoading, hasMore, loadMore, hasError, retry } = usePaginatedFetch(
    pageNumber => fetchScheduledVideos(None.of(), pageNumber, PAGE_SIZE, SortBy.Date, Ordering.Ascending),
    (scheduledVideos, pageNumber) =>
      setDownloadableScheduledVideos((downloadableScheduledVideos) => {
        // Page 0 starts a fresh list (a reload drops what finished while disconnected), keeping
        // only what the stream has delivered since; later pages add to the list.
        const base = pageNumber === 0
          ? downloadableScheduledVideos.filter((_, videoId) => streamUpdatedVideoIds.current.has(videoId))
          : downloadableScheduledVideos

        return scheduledVideos
          .filter((scheduledVideoDownload) => !finishedVideoIds.current.has(scheduledVideoDownload.videoMetadata.id))
          .reduce((videos, scheduledVideoDownload) => {
            const videoId = scheduledVideoDownload.videoMetadata.id

            return streamUpdatedVideoIds.current.has(videoId) && videos.has(videoId)
              ? videos
              : videos.set(videoId, applyUpdate(downloadableScheduledVideos.get(videoId), scheduledVideoDownload))
          }, base)
      }),
    { pageSize: PAGE_SIZE, resetDeps: [reloadKey] }
  )

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

  const onScheduledVideoDownloadUpdate = (scheduledVideoDownload: ScheduledVideoDownload) => {
    const videoId = scheduledVideoDownload.videoMetadata.id

    streamUpdatedVideoIds.current = streamUpdatedVideoIds.current.add(videoId)

    if (isFinishedStatus(scheduledVideoDownload.status)) {
      finishedVideoIds.current = finishedVideoIds.current.add(videoId)
      setDownloadableScheduledVideos(downloadableScheduledVideos => downloadableScheduledVideos.delete(videoId))
    } else {
      // A finished video can be scheduled again.
      finishedVideoIds.current = finishedVideoIds.current.delete(videoId)
      setDownloadableScheduledVideos(downloadableScheduledVideos =>
        downloadableScheduledVideos.set(videoId, applyUpdate(downloadableScheduledVideos.get(videoId), scheduledVideoDownload))
      )
    }
  }

  const onStreamConnectionChange = (connection: StreamConnection) => {
    setStreamConnection(Some.of(connection))

    if (connection === StreamConnection.Connected) {
      if (missedStreamEvents.current) {
        // The list missed whatever happened while disconnected, so reload it from the server.
        missedStreamEvents.current = false
        finishedVideoIds.current = Set<string>()
        streamUpdatedVideoIds.current = Set<string>()
        setReloadKey(key => key + 1)
      }
    } else if (connection === StreamConnection.Disconnected) {
      missedStreamEvents.current = true
      console.error("Scheduled video download stream disconnected")
    } else {
      missedStreamEvents.current = true
      // Transient (e.g. a server restart) and retried by the browser, so not an error.
      console.warn("Scheduled video download stream interrupted, reconnecting")
    }
  }

  useEffect(
    () => scheduledVideoDownloadStream(onDownloadProgress, onScheduledVideoDownloadUpdate, onStreamConnectionChange),
    [streamKey]
  )

  const retryAll = async () => {
    setDisableRetry(true)

    try {
      await retryFailedScheduledVideos()
    } catch (error) {
      notifyError("Failed to retry the failed downloads", error)
    } finally {
      setDisableRetry(false)
    }
  }

  // Both handlers absorb their own failures: the card wires some of them straight to an
  // onClick, so an uncaught rejection would otherwise be invisible to the user.
  const onDelete = (videoId: string) => async () => {
    try {
      // Applied directly, not left to the stream, which may be down.
      onScheduledVideoDownloadUpdate(await deleteScheduledVideoById(videoId))
    } catch (error) {
      notifyError("Failed to delete the scheduled download", error)
    }
  }

  const onUpdateStatus = (videoId: string) => async (schedulingStatus: SchedulingStatus) => {
    try {
      const scheduledVideoDownload = await updateSchedulingStatus(videoId, schedulingStatus)

      // The stream may have reported the video finished while this request was in flight.
      if (!finishedVideoIds.current.has(videoId)) {
        onScheduledVideoDownloadUpdate(scheduledVideoDownload)
      }
    } catch (error) {
      notifyError("Failed to update the download status", error)
    }
  }

  return (
    <div className={styles.scheduledVideos}>
      <Helmet title="Downloading Videos"/>
      {
        streamConnection
          .filter(connection => connection !== StreamConnection.Connected)
          .map(connection =>
            connection === StreamConnection.Reconnecting
              ? <Alert severity="warning" className={styles.streamStatus}>Live updates interrupted. Reconnecting…</Alert>
              : (
                <Alert
                  severity="error"
                  className={styles.streamStatus}
                  action={<Button color="inherit" size="small" onClick={() => setStreamKey(key => key + 1)}>Reconnect</Button>}
                >
                  Live updates stopped.
                </Alert>
              )
          )
          .toNullable()
      }
      <div className={styles.buttonContainer}>
        <VideoScanButton className={styles.scanForVideos}/>
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
        hasMore={hasMore}
        isLoading={isLoading}
        hasError={hasError}
        onRetry={retry}
        endMessage={downloadableScheduledVideos.isEmpty() ? "Nothing is downloading" : undefined}
        className={styles.scheduledVideoGallery}
      >
        {
          downloadableScheduledVideos
            .sortBy((value) => value.scheduledAt.toMillis())
            .toList()
            .toArray()
            .map((downloadableScheduledVideo) => (
                <div key={downloadableScheduledVideo.videoMetadata.id} className={styles.scheduledVideoCard}>
                  <ScheduledVideoDownloadCard
                    downloadableScheduledVideo={downloadableScheduledVideo}
                    onDelete={onDelete(downloadableScheduledVideo.videoMetadata.id)}
                    onUpdateStatus={onUpdateStatus(downloadableScheduledVideo.videoMetadata.id)}/>
                </div>
              )
            )
        }
      </InfiniteScroll>
    </div>
  )
}

export default ScheduledVideos
