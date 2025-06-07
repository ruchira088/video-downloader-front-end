import memoizee from "memoizee"
import {configuration} from "~/services/Configuration"
import {ScheduledVideoDownload} from "~/models/ScheduledVideoDownload"
import {axiosClient} from "~/services/http/HttpClient"
import {SortBy} from "~/models/SortBy"
import {SchedulingStatus} from "~/models/SchedulingStatus"
import {WorkerStatus, WorkerStatusResult} from "~/models/WorkerStatus"
import {Ordering} from "~/models/Ordering"
import type {Option} from "~/types/Option"
import {zodParse} from "~/types/Zod"
import {ListResponse} from "~/models/ListResponse"
import {DownloadProgress} from "~/models/DownloadProgress"
import {EventStreamEventType} from "~/pages/authenticated/downloading/EventStreamEventType"

export const scheduledVideoDownloadStream = (
  onDownloadProgress: (downloadProgress: DownloadProgress) => void,
  onScheduledVideoDownloadUpdate: (scheduledVideoDownload: ScheduledVideoDownload) => void
): (() => void) => {
  const eventSource = new EventSource(`${configuration.apiService}/schedule/updates`, {withCredentials: true})

  const onActionDownloadMessage = (messageEvent: MessageEvent) => {
    const downloadProgress = zodParse(DownloadProgress, JSON.parse(messageEvent.data))
    onDownloadProgress(downloadProgress)
  }

  const onScheduledVideoDownloadUpdateMessage = (messageEvent: MessageEvent) => {
    const scheduledVideoDownload = zodParse(ScheduledVideoDownload, JSON.parse(messageEvent.data))
    onScheduledVideoDownloadUpdate(scheduledVideoDownload)
  }

  eventSource.addEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, onActionDownloadMessage)
  eventSource.addEventListener(EventStreamEventType.SCHEDULED_VIDEO_DOWNLOAD_UPDATE, onScheduledVideoDownloadUpdateMessage)

  return () => {
    eventSource.removeEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, onActionDownloadMessage)
    eventSource.removeEventListener(EventStreamEventType.SCHEDULED_VIDEO_DOWNLOAD_UPDATE, onScheduledVideoDownloadUpdateMessage)
    eventSource.close()
  }
}

export const scheduleVideo = async (videoSiteUrl: string): Promise<ScheduledVideoDownload> => {
  const response = await axiosClient.post("/schedule", { url: videoSiteUrl })
  const scheduledVideoDownload = zodParse(ScheduledVideoDownload, response.data)

  return scheduledVideoDownload
}

const unmemoizedFetchScheduledVideoById = async (videoId: string): Promise<ScheduledVideoDownload> => {
  const response = await axiosClient.get(`/schedule/id/${videoId}`)
  const scheduledVideoDownload = zodParse(ScheduledVideoDownload, response.data)

  return scheduledVideoDownload
}

export const fetchScheduledVideoById: (videoId: string) => Promise<ScheduledVideoDownload> =
  memoizee(unmemoizedFetchScheduledVideoById, { promise: true })

export const updateSchedulingStatus = async (videoId: string, status: SchedulingStatus): Promise<ScheduledVideoDownload> => {
  const response = await axiosClient.put(`/schedule/id/${videoId}`, { status })
  const scheduledVideoDownload = zodParse(ScheduledVideoDownload, response.data)

  return scheduledVideoDownload
}

export const retryFailedScheduledVideos = async (): Promise<ScheduledVideoDownload[]> => {
  const response = await axiosClient.post("/schedule/retry-failed")
  const scheduledVideoDownloads: ListResponse<ScheduledVideoDownload> = zodParse(ListResponse(ScheduledVideoDownload), response.data)

  return scheduledVideoDownloads.results
}

export const fetchWorkerStatus = async (): Promise<WorkerStatus> => {
  const response = await axiosClient.get("/schedule/worker-status")
  const workerStatus = zodParse(WorkerStatusResult, response.data).workerStatus

  return workerStatus
}

export const updateWorkerStatus = async (workerStatus: WorkerStatus): Promise<WorkerStatus> => {
  const response = await axiosClient.put("/schedule/worker-status", { workerStatus })
  const result = zodParse(WorkerStatusResult, response.data).workerStatus

  return result
}

export const deleteScheduledVideoById = async (videoId: string): Promise<ScheduledVideoDownload> => {
  const response = await axiosClient.delete(`/schedule/id/${videoId}`)
  const scheduledVideoDownload = zodParse(ScheduledVideoDownload, response.data)

  return scheduledVideoDownload
}

export const fetchScheduledVideos = async (
  searchTerm: Option<string>,
  pageNumber: number,
  pageSize: number,
  sortBy: SortBy,
  ordering: Ordering
): Promise<ScheduledVideoDownload[]> => {
  const response = await axiosClient
    .get(
      "/schedule/search?",
      {
        params: {
          status: `${[
            SchedulingStatus.Active,
            SchedulingStatus.Error,
            SchedulingStatus.Queued,
            SchedulingStatus.Stale,
            SchedulingStatus.Paused,
            SchedulingStatus.WorkersPaused,
          ].join(",")}`,
          "page-number": pageNumber,
          "page-size": pageSize,
          "sort-by": sortBy,
          order: ordering,
          "search-term": searchTerm.getOrElse(() => ""),
        }
      }
    )

  const scheduledVideoDownloads = zodParse(ListResponse(ScheduledVideoDownload), response.data).results

  return scheduledVideoDownloads
}
