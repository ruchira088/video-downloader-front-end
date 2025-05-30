import { SearchResult } from "~/models/SearchResult"
import { Video } from "~/models/Video"
import { Snapshot } from "~/models/Snapshot"
import { axiosClient } from "~/services/http/HttpClient"
import { VideoMetadata } from "~/models/VideoMetadata"
import { SortBy } from "~/models/SortBy"
import { VideoServiceSummary } from "~/models/VideoServiceSummary"
import { type DurationRange, durationRangeStringEncoder } from "~/models/DurationRange"
import { type Range, rangeEncoder } from "~/models/Range"
import { simpleStringEncoder } from "~/models/Codec"
import type { CancelTokenSource } from "axios"
import { ListResponse } from "~/models/ListResponse"
import type { Option } from "~/types/Option"
import { zodParse } from "~/types/Zod"

export const searchVideos = async (
  maybeSearchTerm: Option<string>,
  durationRange: DurationRange,
  sizeRange: Range<number>,
  videoSites: string[],
  pageNumber: number,
  pageSize: number,
  sortBy: SortBy,
  abortSignal: AbortSignal
): Promise<SearchResult<Video>> => {
  const pageNumberQuery = "page-number=" + pageNumber
  const pageSizeQuery = "page-size=" + pageSize
  const sortByQuery = "sort-by=" + sortBy
  const sizeQuery = "size=" + rangeEncoder(simpleStringEncoder()).encode(sizeRange)
  const durationQuery = "duration=" + rangeEncoder(durationRangeStringEncoder).encode(durationRange)
  const searchTermQuery = maybeSearchTerm.map((term) => "search-term=" + term).getOrElse(() => "")
  const sitesQuery = videoSites.length === 0 ? "" : videoSites.join(",")


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

  const response = await axiosClient.get("/videos/search?" + queryParameters, { signal: abortSignal })

  const searchResult: SearchResult<Video> = zodParse(SearchResult(Video), response.data)

  return searchResult
}

export const fetchVideoById = async (videoId: string): Promise<Video> => {
  const response = await axiosClient.get(`/videos/id/${videoId}`)
  const video = zodParse(Video, response.data)

  return video
}

export const fetchVideoSnapshotsByVideoId = async (videoId: string): Promise<Snapshot[]> => {
  const response = await axiosClient.get(`/videos/id/${videoId}/snapshots`)
  const snapshots = zodParse(ListResponse(Snapshot), response.data)

  return snapshots.results
}

export const metadata = async (url: string): Promise<VideoMetadata> => {
  const response = await axiosClient.post("/videos/metadata", { url })
  const videoMetadata = zodParse(VideoMetadata, response.data)

  return videoMetadata
}

export const updateVideoTitle = async (videoId: string, title: string): Promise<Video> => {
  const response = await axiosClient.patch(`/videos/id/${videoId}/metadata`, { title })
  const video = zodParse(Video, response.data)

  return video
}

export const videoServiceSummary = async (): Promise<VideoServiceSummary> => {
  const response = await axiosClient.get("/videos/summary")
  const videoServiceSummary = zodParse(VideoServiceSummary, response.data)

  return videoServiceSummary
}

export const deleteVideo = async (videoId: string, deleteFile: boolean): Promise<Video> => {
  const response = await axiosClient.delete(`/videos/id/${videoId}?delete-video-file=${deleteFile}`)
  const video = zodParse(Video, response.data)

  return video
}

export const scanForVideos = (): Promise<void> => axiosClient.post("/videos/scan")