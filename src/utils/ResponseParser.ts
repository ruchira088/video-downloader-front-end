/* eslint @typescript-eslint/no-explicit-any: ["off"] */

import moment, { Moment } from "moment"
import { Maybe } from "monet"
import VideoMetadata from "models/VideoMetadata"
import { FileResourceType } from "models/FileResource"
import Video from "models/Video"
import SearchResult from "models/ListResult"
import ScheduledVideoDownload from "models/ScheduledVideoDownload"
import { Snapshot } from "models/Snapshot"
import { AuthenticationToken } from "models/AuthenticationToken"
import { DownloadProgress } from "models/DownloadProgress"
import { VideoServiceSummary } from "models/VideoServiceSummary"
import BackendServiceInformation from "models/BackendServiceInformation"

interface PartialFileResource {
  readonly id: string
  readonly createdAt: Moment
  readonly path: string
  readonly mediaType: string
  readonly size: number
}

export const parseVideoMetadata = (json: any): VideoMetadata => ({
  ...json,
  duration: moment.duration(json.duration.length, json.duration.unit),
  thumbnail: {...parseFileResource(json.thumbnail), type: FileResourceType.Thumbnail},
})

const parseFileResource = (json: any): PartialFileResource => ({
  ...json,
  createdAt: moment(json.createdAt),
})

export const parseVideo = (json: any): Video => ({
  videoMetadata: parseVideoMetadata(json.videoMetadata),
  fileResource: {...parseFileResource(json.fileResource), type: FileResourceType.Video},
})

export const parseSnapshot = (json: any): Snapshot => ({
  videoId: json.videoId,
  fileResource: {...parseFileResource(json.fileResource), type: FileResourceType.Snapshot},
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
    status: json.status,
    scheduledAt: moment(json.scheduledAt),
    downloadedBytes: json.downloadedBytes,
  }
}

export const parseAuthenticationToken = (json: any): AuthenticationToken => ({
  secret: json.secret,
  expiresAt: moment(json.expiresAt),
  issuedAt: moment(json.issuedAt),
  renewals: json.renewals,
})

export const parseVideoServiceSummary = (json: any): VideoServiceSummary => ({
  ...json,
  totalDuration: moment.duration(json.totalDuration.length, json.totalDuration.unit),
})

export const parseBackendServiceInformation = (json: any): BackendServiceInformation => ({
  ...json,
  currentTimestamp: moment(json.currentTimestamp),
  buildTimestamp: Maybe.fromNull(json.buildTimestamp).map(moment),
  gitCommit: Maybe.fromNull(json.gitCommit),
  gitBranch: Maybe.fromNull(json.gitBranch),
})

export const parseDownloadProgress = (json: any): DownloadProgress => ({ ...json, updatedAt: moment(json.updatedAt) })
