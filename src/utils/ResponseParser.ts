import moment from "moment"
import { Maybe } from "monet"
import VideoMetadata from "models/VideoMetadata"
import FileResource from "models/FileResource"
import Video from "models/Video"
import SearchResult from "models/ListResult"
import ScheduledVideoDownload from "models/ScheduledVideoDownload"
import { Snapshot } from "models/Snapshot"
import { AuthenticationToken } from "models/AuthenticationToken"
import { DownloadProgress } from "models/DownloadProgress"

export const parseVideoMetadata = (json: any): VideoMetadata => ({
  ...json,
  duration: moment.duration(json.duration.length, json.duration.unit),
  thumbnail: parseFileResource(json.thumbnail),
})

const parseFileResource = (json: any): FileResource => ({
  ...json,
  createdAt: moment(json.createdAt),
})

export const parseVideo = (json: any): Video => ({
  videoMetadata: parseVideoMetadata(json.videoMetadata),
  fileResource: parseFileResource(json.fileResource),
})

export const parseSnapshot = (json: any): Snapshot => ({
  videoId: json.videoId,
  fileResource: parseFileResource(json.fileResource),
  videoTimestamp: moment.duration(json.videoTimestamp.length, json.videoTimestamp.unit),
})

export function searchResultParser<A>(parser: (json: any) => A): (json: any) => SearchResult<A> {
  return (json: any) => ({ ...json, results: json.results.map(parser) })
}

export const parseScheduledVideoDownload = (json: any): ScheduledVideoDownload => {
  const completedAt = Maybe.fromNull(json.completedAt).map(moment)
  const videoMetadata = parseVideoMetadata(json.videoMetadata)

  return {
    completedAt,
    videoMetadata,
    scheduledAt: moment(json.scheduledAt),
    downloadedBytes: completedAt
      .map(() => videoMetadata.size)
      .orElse(Maybe.fromNull(json.downloadedBytes))
      .getOrElse(0),
  }
}

export const parseAuthenticationToken = (json: any): AuthenticationToken => ({
  secret: json.secret,
  expiresAt: moment(json.expiresAt),
  issuedAt: moment(json.issuedAt),
  renewals: json.renewals,
})

export const parseDownloadProgress = (json: any): DownloadProgress => ({ ...json, updatedAt: moment(json.updatedAt) })
