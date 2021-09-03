import { Maybe } from "monet"
import SearchResult from "models/ListResult"
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
import { DurationRange, durationRangeEncoder } from "models/DurationRange"
import {rangeQueryParameter} from "models/Range"

export const searchVideos = (
  searchTerm: Maybe<string>,
  durationRange: DurationRange,
  pageNumber: number,
  pageSize: number,
  sortBy: SortBy
): Promise<SearchResult<Video>> =>
  axiosClient
    .get(
      `/videos/search?page-number=${pageNumber}&page-size=${pageSize}&sort-by=${sortBy}&duration=${rangeQueryParameter(
        durationRange, durationRangeEncoder
      )}${searchTerm.fold("")((term) => `&search-term=${term}`)}`
    )
    .then(({ data }) => searchResultParser(parseVideo)(data))

export const fetchVideoById = (videoId: string): Promise<Video> =>
  axiosClient.get(`/videos/id/${videoId}`).then(({ data }) => parseVideo(data))

export const fetchVideoSnapshots = (videoId: string): Promise<Snapshot[]> =>
  axiosClient.get(`/videos/id/${videoId}/snapshots`).then(({ data }) => data.results.map(parseSnapshot))

export const metadata = (url: string): Promise<VideoMetadata> =>
  axiosClient.post("/videos/metadata", { url }).then(({ data }) => parseVideoMetadata(data))

export const updateVideoTitle = (videoId: string, title: string): Promise<Video> =>
  axiosClient.patch(`/videos/id/${videoId}/metadata`, { title }).then(({ data }) => parseVideo(data))

export const videoServiceSummary = (): Promise<VideoServiceSummary> =>
  axiosClient.get("/videos/summary").then(({ data }) => parseVideoServiceSummary(data))
