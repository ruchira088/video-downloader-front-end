import {SearchResult} from "~/models/SearchResult"
import {Video} from "~/models/Video"
import {Snapshot} from "~/models/Snapshot"
import {axiosClient} from "~/services/http/HttpClient"
import {VideoMetadata} from "~/models/VideoMetadata"
import {VideoScan} from "~/models/VideoScan"
import {SortBy} from "~/models/SortBy"
import {VideoServiceSummary} from "~/models/VideoServiceSummary"
import {type DurationRange, durationRangeStringEncoder} from "~/models/DurationRange"
import {type Range, rangeEncoder} from "~/models/Range"
import {simpleStringEncoder} from "~/models/Codec"
import {ListResponse} from "~/models/ListResponse"
import type {Option} from "~/types/Option"
import {zodParse} from "~/types/Zod"
import type {Ordering} from "~/models/Ordering"
import {DuplicateVideoGroups} from "~/models/DuplicateVideo"

export const searchVideos = async (
  maybeSearchTerm: Option<string>,
  durationRange: DurationRange,
  sizeRange: Range<number>,
  videoSites: string[],
  pageNumber: number,
  pageSize: number,
  sortBy: SortBy,
  ordering: Ordering,
  abortSignal: AbortSignal
): Promise<SearchResult<Video>> => {
  const response = await axiosClient.get("/videos/search", {
    signal: abortSignal,
    params: {
      "page-number": pageNumber,
      "page-size": pageSize,
      "sort-by": sortBy,
      size: rangeEncoder(simpleStringEncoder()).encode(sizeRange),
      duration: rangeEncoder(durationRangeStringEncoder).encode(durationRange),
      order: ordering,
      "search-term": maybeSearchTerm.toNullable(),
      site: videoSites.length === 0 ? undefined : videoSites.join(","),
    },
  })

  return zodParse(SearchResult(Video), response.data)
}

export const fetchVideoById = async (videoId: string): Promise<Video> => {
  const response = await axiosClient.get(`/videos/id/${videoId}`)
  return zodParse(Video, response.data)
}

export const fetchVideoSnapshotsByVideoId = async (videoId: string): Promise<Snapshot[]> => {
  const response = await axiosClient.get(`/videos/id/${videoId}/snapshots`)
  return zodParse(ListResponse(Snapshot), response.data).results
}

export const metadata = async (url: string): Promise<VideoMetadata> => {
  const response = await axiosClient.post("/videos/metadata", { url })
  return zodParse(VideoMetadata, response.data)
}

export const updateVideoTitle = async (videoId: string, title: string): Promise<Video> => {
  const response = await axiosClient.patch(`/videos/id/${videoId}/metadata`, { title })
  return zodParse(Video, response.data)
}

export const videoServiceSummary = async (): Promise<VideoServiceSummary> => {
  const response = await axiosClient.get("/videos/summary")
  return zodParse(VideoServiceSummary, response.data)
}

export const deleteVideo = async (videoId: string, deleteFile: boolean): Promise<Video> => {
  const response = await axiosClient.delete(`/videos/id/${videoId}`, {
    params: {
      "delete-video-file": deleteFile,
    },
  })
  return zodParse(Video, response.data)
}

export const fetchDuplicateVideos = async (pageNumber: number, pageSize: number): Promise<DuplicateVideoGroups> => {
  const response = await axiosClient.get("/videos/duplicates", {
    params: {
      "page-number": pageNumber,
      "page-size": pageSize,
    },
  })
  return zodParse(DuplicateVideoGroups, response.data)
}

export const scanForVideos = (): Promise<void> => axiosClient.post("/videos/scan")

export const fetchVideoScanStatus = async (): Promise<VideoScan> => {
  const response = await axiosClient.get("/videos/scan")
  return zodParse(VideoScan, response.data)
}