import memoizee from "memoizee"
import { configuration } from "~/services/Configuration"
import { ScheduledVideoDownload } from "~/models/ScheduledVideoDownload"
import { axiosClient } from "~/services/http/HttpClient"
import { SortBy } from "~/models/SortBy"
import { SchedulingStatus } from "~/models/SchedulingStatus"
import { WorkerStatus, WorkerStatusResult } from "~/models/WorkerStatus"
import { Ordering } from "~/models/Ordering"
import type { Option } from "~/types/Option"
import { ListResponse } from "~/models/ListResponse"
import { DownloadProgress } from "~/models/DownloadProgress"
import { EventStreamEventType } from "~/pages/authenticated/pending/EventStreamEventType"

export const scheduledVideoDownloadStream = (onDownloadProgress: (downloadProgress: DownloadProgress) => void): (() => void) => {
  const eventSource = new EventSource(`${configuration.apiService}/schedule/active`, { withCredentials: true })

  const onMessageEvent = (messageEvent: MessageEvent) => {
    const downloadProgress = DownloadProgress.parse(JSON.parse(messageEvent.data))
    onDownloadProgress(downloadProgress)
  }

  eventSource.addEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, onMessageEvent)

  return () => {
    eventSource.removeEventListener(EventStreamEventType.ACTIVE_DOWNLOAD, onMessageEvent)
    eventSource.close()
  }
}

export const scheduleVideo = async (videoSiteUrl: string): Promise<ScheduledVideoDownload> => {
  const response = await axiosClient.post("/schedule", { url: videoSiteUrl })
  const scheduledVideoDownload = ScheduledVideoDownload.parse(response.data)

  return scheduledVideoDownload
}

const unmemoizedFetchScheduledVideoById = async (videoId: string): Promise<ScheduledVideoDownload> => {
  const response = await axiosClient.get(`/schedule/id/${videoId}`)
  const scheduledVideoDownload = ScheduledVideoDownload.parse(response.data)

  return scheduledVideoDownload
}

export const fetchScheduledVideoById: (videoId: string) => Promise<ScheduledVideoDownload> =
  memoizee(unmemoizedFetchScheduledVideoById, { promise: true })

export const updateSchedulingStatus = async (videoId: string, status: SchedulingStatus): Promise<ScheduledVideoDownload> => {
  const response = await axiosClient.put(`/schedule/id/${videoId}`, { status })
  const scheduledVideoDownload = ScheduledVideoDownload.parse(response.data)

  return scheduledVideoDownload
}

export const fetchWorkerStatus = async (): Promise<WorkerStatus> => {
  const response = await axiosClient.get("/schedule/worker-status")
  const workerStatus = WorkerStatusResult.parse(response.data).workerStatus

  return workerStatus
}

export const updateWorkerStatus = async (workerStatus: WorkerStatus): Promise<WorkerStatus> => {
  const response = await axiosClient.put("/schedule/worker-status", { workerStatus })
  const result = WorkerStatusResult.parse(response.data).workerStatus

  return result
}

export const deleteScheduledVideoById = async (videoId: string): Promise<ScheduledVideoDownload> => {
  const response = await axiosClient.delete(`/schedule/id/${videoId}`)
  const scheduledVideoDownload = ScheduledVideoDownload.parse(response.data)

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
          ordering: ordering,
          "search-term": searchTerm.getOrElse(() => ""),
        }
      }
    )

  const scheduledVideoDownloads = ListResponse(ScheduledVideoDownload).parse(response.data).results

  return scheduledVideoDownloads
}
