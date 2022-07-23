import { Maybe, NonEmptyList } from "monet"
import SearchResult from "models/SearchResult"
import Video from "models/Video"
import {
  parseSnapshot,
  parseVideo,
  parseVideoMetadata,
  parseVideoServiceSummary,
  searchResultParser,
} from "utils/ResponseParser"
import { Snapshot } from "models/Snapshot"
import { axiosClient } from "services/http/HttpClient"
import VideoMetadata from "models/VideoMetadata"
import { SortBy } from "models/SortBy"
import { VideoServiceSummary } from "models/VideoServiceSummary"
import { DurationRange, durationRangeStringEncoder } from "models/DurationRange"
import Range, { rangeEncoder } from "models/Range"
import { simpleStringEncoder } from "models/Codec"
import { CancelTokenSource } from "axios"
import { ListResponse } from "../../models/ListResponse"

export const searchVideos = (
  maybeSearchTerm: Maybe<string>,
  durationRange: DurationRange,
  sizeRange: Range<number>,
  maybeVideoSites: Maybe<NonEmptyList<string>>,
  pageNumber: number,
  pageSize: number,
  sortBy: SortBy,
  cancelTokenSource: CancelTokenSource
): Promise<SearchResult<Video>> => {
  const pageNumberQuery = "page-number=" + pageNumber
  const pageSizeQuery = "page-size=" + pageSize
  const sortByQuery = "sort-by=" + sortBy
  const sizeQuery = "size=" + rangeEncoder(simpleStringEncoder()).encode(sizeRange)
  const durationQuery = "duration=" + rangeEncoder(durationRangeStringEncoder).encode(durationRange)
  const searchTermQuery = maybeSearchTerm.map((term) => "search-term=" + term).getOrElse("")
  const sitesQuery = maybeVideoSites.map((sites) => "site=" + sites.toArray().join(",")).getOrElse("")

  const queryParameters: string = [
    pageNumberQuery,
    pageSizeQuery,
    sortByQuery,
    sizeQuery,
    durationQuery,
    searchTermQuery,
    sitesQuery,
  ]
    .filter((query) => query !== "")
    .join("&")

  return axiosClient
    .get("/videos/search?" + queryParameters, { cancelToken: cancelTokenSource.token })
    .then(({ data }) => searchResultParser(parseVideo)(data))
}

export const fetchVideoById = (videoId: string): Promise<Video> =>
  axiosClient.get(`/videos/id/${videoId}`).then(({ data }) => parseVideo(data))

export const fetchVideoSnapshots = (videoId: string): Promise<Snapshot[]> =>
  axiosClient
    .get<ListResponse<Record<string, unknown>>>(`/videos/id/${videoId}/snapshots`)
    .then(({ data }) => data.results.map(parseSnapshot))

export const metadata = (url: string): Promise<VideoMetadata> =>
  axiosClient.post("/videos/metadata", { url }).then(({ data }) => parseVideoMetadata(data))

export const updateVideoTitle = (videoId: string, title: string): Promise<Video> =>
  axiosClient.patch(`/videos/id/${videoId}/metadata`, { title }).then(({ data }) => parseVideo(data))

export const videoServiceSummary = (): Promise<VideoServiceSummary> =>
  axiosClient.get("/videos/summary").then(({ data }) => parseVideoServiceSummary(data))

export const deleteVideo = (videoId: string, deleteFile: boolean): Promise<Video> =>
  axiosClient.delete(`/videos/id/${videoId}?delete-video-file=${deleteFile}`)
    .then(({ data }) => parseVideo(data))

export const scanForVideos = (): Promise<void> => axiosClient.post("/videos/scan")