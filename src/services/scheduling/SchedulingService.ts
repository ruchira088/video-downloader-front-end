import { Maybe } from "monet"
import memoizee from "memoizee"
import { configuration } from "services/Configuration"
import ScheduledVideoDownload from "models/ScheduledVideoDownload"
import { parseScheduledVideoDownload } from "utils/ResponseParser"
import { axiosClient } from "services/http/HttpClient"
import { SortBy } from "models/SortBy"

export const scheduledVideoDownloadStream = (): EventSource =>
  new EventSource(`${configuration.apiService}/schedule/active`, {
    withCredentials: true,
  })

export const scheduleVideo = (videoSiteUrl: string): Promise<ScheduledVideoDownload> =>
  axiosClient.post("/schedule", { url: videoSiteUrl }).then(({ data }) => parseScheduledVideoDownload(data))

const unmemoizedFetchScheduledVideoById = (videoId: string): Promise<ScheduledVideoDownload> =>
  axiosClient.get(`schedule/videoId/${videoId}`).then(({ data }) => parseScheduledVideoDownload(data))

export const fetchScheduledVideoById: (
  videoId: string
) => Promise<ScheduledVideoDownload> = memoizee(unmemoizedFetchScheduledVideoById, { promise: true })

export const fetchScheduledVideos = (
  searchTerm: Maybe<string>,
  pageNumber: number,
  pageSize: number,
  sortBy: SortBy
): Promise<ScheduledVideoDownload[]> =>
  axiosClient
    .get(
      `/schedule/search?page-size=${pageSize}&page-number=${pageNumber}&sort-by=${sortBy}${searchTerm.fold(String())(
        (term) => `&search-term=${term}`
      )}`
    )
    .then(({ data }) => data.results.map(parseScheduledVideoDownload))
