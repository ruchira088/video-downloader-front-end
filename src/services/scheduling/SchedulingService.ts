import { Maybe } from "monet"
import memoizee from "memoizee"
import { configuration } from "services/Configuration"
import ScheduledVideoDownload from "models/ScheduledVideoDownload"
import { parseScheduledVideoDownload } from "utils/ResponseParser"
import { axiosClient } from "services/http/HttpClient"
import { SortBy } from "models/SortBy"
import { SchedulingStatus } from "models/SchedulingStatus"
import { WorkerStatus } from "models/WorkerStatus"
import { WorkerStatusResponse } from "../../models/WorkerStatusResponse"
import SearchResult from "../../models/SearchResult"

export const scheduledVideoDownloadStream = (): EventSource =>
  new EventSource(`${configuration.apiService}/schedule/active`, {
    withCredentials: true,
  })

export const scheduleVideo = (videoSiteUrl: string): Promise<ScheduledVideoDownload> =>
  axiosClient.post("/schedule", { url: videoSiteUrl }).then(({ data }) => parseScheduledVideoDownload(data))

const unmemoizedFetchScheduledVideoById = (videoId: string): Promise<ScheduledVideoDownload> =>
  axiosClient.get(`/schedule/id/${videoId}`).then(({ data }) => parseScheduledVideoDownload(data))

export const fetchScheduledVideoById: (videoId: string) => Promise<ScheduledVideoDownload> = memoizee(
  unmemoizedFetchScheduledVideoById,
  { promise: true }
)

export const updateSchedulingStatus = (videoId: string, status: SchedulingStatus): Promise<ScheduledVideoDownload> =>
  axiosClient.put(`/schedule/id/${videoId}`, { status }).then(({ data }) => parseScheduledVideoDownload(data))

export const fetchWorkerStatus = (): Promise<WorkerStatus> =>
  axiosClient.get<WorkerStatusResponse>("/schedule/worker-status").then(({ data }) => data.workerStatus)

export const updateWorkerStatus = (workerStatus: WorkerStatus): Promise<WorkerStatus> =>
  axiosClient
    .put<WorkerStatusResponse>("/schedule/worker-status", { workerStatus })
    .then(({ data }) => data.workerStatus)

export const fetchScheduledVideos = (
  searchTerm: Maybe<string>,
  pageNumber: number,
  pageSize: number,
  sortBy: SortBy
): Promise<ScheduledVideoDownload[]> =>
  axiosClient
    .get<SearchResult<Record<string, unknown>>>(
      "/schedule/search?" +
        [
          `status=${[
            SchedulingStatus.Active,
            SchedulingStatus.Error,
            SchedulingStatus.Queued,
            SchedulingStatus.Paused,
            SchedulingStatus.WorkersPaused,
          ].join(",")}`,
          `page-size=${pageSize}`,
          `page-number=${pageNumber}`,
          `sort-by=${sortBy}`,
          `search-term=${searchTerm.getOrElse("")}`,
        ].join("&")
    )
    .then(({ data }) => data.results.map(parseScheduledVideoDownload))
