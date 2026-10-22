import {apiConfiguration} from "~/services/ApiConfiguration"
import {ScheduledVideoDownload} from "~/models/ScheduledVideoDownload"
import {axiosClient} from "~/services/http/HttpClient"
import {SortBy} from "~/models/SortBy"
import {isFinishedStatus, SchedulingStatus} from "~/models/SchedulingStatus"
import {WorkerStatus, WorkerStatusResult} from "~/models/WorkerStatus"
import {Ordering} from "~/models/Ordering"
import type {Option} from "~/types/Option"
import {Either} from "~/types/Either"
import {zodParse} from "~/types/Zod"
import {ListResponse} from "~/models/ListResponse"
import {DownloadProgress} from "~/models/DownloadProgress"
import {EventStreamEventType} from "~/models/EventStreamEventType"
import { reportError } from "~/services/ErrorReporting"

export enum StreamConnection {
  Connected = "Connected",
  // The browser is retrying on its own; events sent in the meantime are lost.
  Reconnecting = "Reconnecting",
  // The browser has given up (e.g. the server answered 401) and will not retry.
  Disconnected = "Disconnected"
}

// EventSource.CLOSED, spelled out so it does not depend on the global being present.
const EVENT_SOURCE_CLOSED = 2

export const scheduledVideoDownloadStream = (
  onDownloadProgress: (downloadProgress: DownloadProgress) => void,
  onScheduledVideoDownloadUpdate: (scheduledVideoDownload: ScheduledVideoDownload) => void,
  onConnectionChange: (connection: StreamConnection) => void
): (() => void) => {
  const eventSource = new EventSource(`${apiConfiguration.baseUrl}/schedule/updates`, {withCredentials: true})

  const onActionDownloadMessage = (messageEvent: MessageEvent) =>
    Either.fromTry(() => zodParse(DownloadProgress, JSON.parse(messageEvent.data)))
      .fold(
        error => reportError("Failed to parse download progress event", error),
        onDownloadProgress
      )

  const onScheduledVideoDownloadUpdateMessage = (messageEvent: MessageEvent) =>
    Either.fromTry(() => zodParse(ScheduledVideoDownload, JSON.parse(messageEvent.data)))
      .fold(
        error => reportError("Failed to parse scheduled video download update event", error),
        onScheduledVideoDownloadUpdate
      )

  eventSource.addEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, onActionDownloadMessage)
  eventSource.addEventListener(EventStreamEventType.SCHEDULED_VIDEO_DOWNLOAD_UPDATE, onScheduledVideoDownloadUpdateMessage)
  eventSource.onopen = () => onConnectionChange(StreamConnection.Connected)
  eventSource.onerror = () =>
    onConnectionChange(
      eventSource.readyState === EVENT_SOURCE_CLOSED ? StreamConnection.Disconnected : StreamConnection.Reconnecting
    )

  return () => {
    eventSource.removeEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, onActionDownloadMessage)
    eventSource.removeEventListener(EventStreamEventType.SCHEDULED_VIDEO_DOWNLOAD_UPDATE, onScheduledVideoDownloadUpdateMessage)
    eventSource.onopen = null
    eventSource.onerror = null
    eventSource.close()
  }
}

export const scheduleVideo = async (videoSiteUrl: string): Promise<ScheduledVideoDownload> => {
  const response = await axiosClient.post("/schedule", { url: videoSiteUrl })

  return zodParse(ScheduledVideoDownload, response.data)
}

export const updateSchedulingStatus = async (videoId: string, status: SchedulingStatus): Promise<ScheduledVideoDownload> => {
  const response = await axiosClient.put(`/schedule/id/${encodeURIComponent(videoId)}`, { status })

  return zodParse(ScheduledVideoDownload, response.data)
}

export const retryFailedScheduledVideos = async (): Promise<ScheduledVideoDownload[]> => {
  const response = await axiosClient.post("/schedule/retry-failed")

  return zodParse(ListResponse(ScheduledVideoDownload), response.data).results
}

export const fetchWorkerStatus = async (): Promise<WorkerStatus> => {
  const response = await axiosClient.get("/schedule/worker-status")

  return zodParse(WorkerStatusResult, response.data).workerStatus
}

export const updateWorkerStatus = async (workerStatus: WorkerStatus): Promise<WorkerStatus> => {
  const response = await axiosClient.put("/schedule/worker-status", { workerStatus })

  return zodParse(WorkerStatusResult, response.data).workerStatus
}

export const deleteScheduledVideoById = async (videoId: string): Promise<ScheduledVideoDownload> => {
  const response = await axiosClient.delete(`/schedule/id/${encodeURIComponent(videoId)}`)

  return zodParse(ScheduledVideoDownload, response.data)
}

export const fetchScheduledVideos = async (
  searchTerm: Option<string>,
  pageNumber: number,
  pageSize: number,
  sortBy: SortBy,
  ordering: Ordering
): Promise<ScheduledVideoDownload[]> => {
  const response = await axiosClient.get("/schedule/search", {
    params: {
      // Every in-progress status, matching what the live stream keeps on the page. Acquired
      // (claimed by a worker) and Downloaded (post-processing) are in progress too.
      status: Object.values(SchedulingStatus).filter((status) => !isFinishedStatus(status)).join(","),
      "page-number": pageNumber,
      "page-size": pageSize,
      "sort-by": sortBy,
      order: ordering,
      "search-term": searchTerm.toNullable(),
    },
  })

  return zodParse(ListResponse(ScheduledVideoDownload), response.data).results
}
