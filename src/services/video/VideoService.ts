import { Maybe, NonEmptyList } from "monet"
import SearchResult from "models/ListResult"
import Video from "models/Video"
import {
  parseSnapshot,
  parseVideo,
  parseVideoMetadata,
  parseVideoServiceSummary,
  searchResultParser
} from "utils/ResponseParser"
import { Snapshot } from "models/Snapshot"
import { axiosClient } from "services/http/HttpClient"
import VideoMetadata from "models/VideoMetadata"
import { SortBy } from "models/SortBy"
import { VideoServiceSummary } from "models/VideoServiceSummary"
import { DurationRange, durationRangeStringEncoder } from "models/DurationRange"
import Range, { rangeEncoder } from "models/Range"
import { simpleStringEncoder } from "models/Codec"

export const searchVideos = (
  maybeSearchTerm: Maybe<string>,
  durationRange: DurationRange,
  sizeRange: Range<number>,
  maybeVideoSites: Maybe<NonEmptyList<string>>,
  pageNumber: number,
  pageSize: number,
  sortBy: SortBy
): Promise<SearchResult<Video>> => {
  const pageNumberQuery = "page-number=" + pageNumber
  const pageSizeQuery = "page-size=" + pageSize
  const sizeQuery = "size=" + rangeEncoder(simpleStringEncoder()).encode(sizeRange)
  const durationQuery = "duration=" + rangeEncoder(durationRangeStringEncoder).encode(durationRange)
  const searchTermQuery = maybeSearchTerm.map(term => "search-term=" + term).getOrElse("")
  const sitesQuery = maybeVideoSites.map(sites => "site=" + sites.toArray().join(",")).getOrElse("")

  const queryParameters: string =
    [ pageNumberQuery, pageSizeQuery, sizeQuery, durationQuery, searchTermQuery, sitesQuery]
      .filter(query => query !== "")
      .join("&")

  return axiosClient
    .get("/videos/search?" + queryParameters)
    .then(({ data }) => searchResultParser(parseVideo)(data))
}

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
