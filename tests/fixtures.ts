/**
 * Shared test fixtures.
 *
 * Every model is described **once**, in the shape the API actually returns (`*Json`).
 * The domain-object builders (`buildX`) derive from that same description by running it
 * through the real Zod schema, so a fixture can never drift from its model: if a schema
 * gains a field or changes a type, the builders fail loudly instead of quietly handing
 * tests a shape the app would never see.
 *
 * That split matters because the two halves of the suite need different things:
 *   - service tests mock axios, so they need the **wire** shape (`videoJson()`) — ISO
 *     strings, `{ length, unit }` durations, `null` for absent values.
 *   - component and page tests render parsed models, so they need the **domain** shape
 *     (`buildVideo()`) — Luxon `DateTime`/`Duration`, `Option`, and the `type` discriminator
 *     that `FileResource`'s transform adds.
 *
 * Every builder takes an overrides object that is deep-merged over the defaults, so a test
 * states only the fields it actually cares about:
 *
 *     buildVideo({ id: "video-1", title: "Cats" })
 *     buildVideo({ videoMetadata: { duration: durationJson(330) } })
 */
import { zodParse } from "~/types/Zod"
import { Video } from "~/models/Video"
import { VideoMetadata } from "~/models/VideoMetadata"
import { Snapshot } from "~/models/Snapshot"
import { Playlist } from "~/models/Playlist"
import { ScheduledVideoDownload } from "~/models/ScheduledVideoDownload"
import { Downloadable, type DownloadableScheduledVideo } from "~/models/DownloadableScheduledVideo"
import { VideoWatchHistory } from "~/models/VideoWatchHistory"
import { User } from "~/models/User"
import { AuthenticationToken, StoredAuthenticationToken } from "~/models/AuthenticationToken"
import { HealthCheck } from "~/models/HealthCheck"
import { BackendServiceInformation } from "~/models/BackendServiceInformation"
import { VideoServiceSummary } from "~/models/VideoServiceSummary"
import { SchedulingStatus } from "~/models/SchedulingStatus"

export type Json = Record<string, unknown>

const isPlainObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/**
 * Deep-merges overrides over defaults. Arrays and non-objects replace wholesale, which is
 * what a test means by `{ videos: [] }` or `{ errorInfo: null }`.
 */
const merge = (base: Json, overrides: Json): Json =>
  Object.entries(overrides).reduce<Json>(
    (accumulator, [key, value]) => ({
      ...accumulator,
      [key]: isPlainObject(value) && isPlainObject(accumulator[key])
        ? merge(accumulator[key], value)
        : value
    }),
    { ...base }
  )

/** Fixed so that tests asserting on rendered dates are not wall-clock dependent. */
export const TIMESTAMP = "2024-01-15T10:00:00+00:00"

/** The wire encoding of a Luxon `Duration`, as `ZodDuration` expects it. */
export const durationJson = (length: number, unit: string = "seconds") => ({ length, unit })

// ---------------------------------------------------------------------------
// FileResource
// ---------------------------------------------------------------------------

export const fileResourceJson = (overrides: Json = {}): Json => {
  const { id = "file-123", ...rest } = overrides

  return merge(
    {
      id,
      createdAt: TIMESTAMP,
      path: `/files/${String(id)}`,
      mediaType: "image/jpeg",
      size: 1024
    },
    rest
  )
}

// ---------------------------------------------------------------------------
// VideoMetadata
// ---------------------------------------------------------------------------

export const videoMetadataJson = (overrides: Json = {}): Json => {
  const { id = "video-123", title = "Test Video", ...rest } = overrides

  return merge(
    {
      url: `https://example.com/video/${String(id)}`,
      id,
      videoSite: "youtube",
      title,
      duration: durationJson(330),
      size: 1024000000,
      thumbnail: fileResourceJson({
        id: `thumb-${String(id)}`,
        path: "/path/to/thumb",
        mediaType: "image/jpeg"
      })
    },
    rest
  )
}

export const buildVideoMetadata = (overrides: Json = {}): VideoMetadata =>
  zodParse(VideoMetadata, videoMetadataJson(overrides))

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

export const videoJson = (overrides: Json = {}): Json => {
  const { id = "video-123", title = "Test Video", ...rest } = overrides

  return merge(
    {
      videoMetadata: videoMetadataJson({ id, title }),
      fileResource: fileResourceJson({
        id: `file-${String(id)}`,
        path: "/path/to/video",
        mediaType: "video/mp4",
        size: 1024000000
      }),
      createdAt: TIMESTAMP,
      watchTime: durationJson(120)
    },
    rest
  )
}

export const buildVideo = (overrides: Json = {}): Video => zodParse(Video, videoJson(overrides))

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

export const snapshotJson = (overrides: Json = {}): Json => {
  const { id = "snapshot-123", videoId = "video-123", ...rest } = overrides

  return merge(
    {
      videoId,
      fileResource: fileResourceJson({
        id,
        path: `/snapshots/${String(id)}.jpg`,
        mediaType: "image/jpeg"
      }),
      videoTimestamp: durationJson(60)
    },
    rest
  )
}

export const buildSnapshot = (overrides: Json = {}): Snapshot => zodParse(Snapshot, snapshotJson(overrides))

// ---------------------------------------------------------------------------
// Playlist
// ---------------------------------------------------------------------------

export const playlistJson = (overrides: Json = {}): Json => {
  const { id = "playlist-123", title = "Test Playlist", ...rest } = overrides

  return merge(
    {
      id,
      userId: "user-123",
      createdAt: TIMESTAMP,
      title,
      description: "Test description",
      videos: [],
      albumArt: null
    },
    rest
  )
}

export const buildPlaylist = (overrides: Json = {}): Playlist => zodParse(Playlist, playlistJson(overrides))

// ---------------------------------------------------------------------------
// ScheduledVideoDownload
// ---------------------------------------------------------------------------

export const scheduledVideoDownloadJson = (overrides: Json = {}): Json => {
  const { id = "video-123", title = "Test Video", ...rest } = overrides

  return merge(
    {
      lastUpdatedAt: TIMESTAMP,
      scheduledAt: "2024-01-15T09:00:00+00:00",
      videoMetadata: videoMetadataJson({ id, title }),
      errorInfo: null,
      status: SchedulingStatus.Queued,
      downloadedBytes: 0,
      completedAt: null
    },
    rest
  )
}

export const buildScheduledVideoDownload = (overrides: Json = {}): ScheduledVideoDownload =>
  zodParse(ScheduledVideoDownload, scheduledVideoDownloadJson(overrides))

/**
 * `DownloadableScheduledVideo` is an intersection type rather than a schema, so it is
 * assembled from the two schemas that make it up.
 */
export const buildDownloadableScheduledVideo = (overrides: Json = {}): DownloadableScheduledVideo => {
  const { downloadedBytes, lastUpdatedAt, downloadHistory, downloadSpeed, ...scheduledOverrides } = overrides

  const downloadable = zodParse(
    Downloadable,
    merge(
      {
        downloadedBytes: 0,
        lastUpdatedAt: TIMESTAMP,
        downloadHistory: [],
        downloadSpeed: null
      },
      {
        ...(downloadedBytes === undefined ? {} : { downloadedBytes }),
        ...(lastUpdatedAt === undefined ? {} : { lastUpdatedAt }),
        ...(downloadHistory === undefined ? {} : { downloadHistory }),
        ...(downloadSpeed === undefined ? {} : { downloadSpeed })
      }
    )
  )

  const scheduled = buildScheduledVideoDownload({
    ...scheduledOverrides,
    ...(downloadedBytes === undefined ? {} : { downloadedBytes }),
    ...(lastUpdatedAt === undefined ? {} : { lastUpdatedAt })
  })

  return { ...scheduled, ...downloadable }
}

// ---------------------------------------------------------------------------
// VideoWatchHistory
// ---------------------------------------------------------------------------

export const videoWatchHistoryJson = (overrides: Json = {}): Json => {
  const { id = "history-123", videoId = "video-123", title = "Test Video", ...rest } = overrides

  return merge(
    {
      id,
      duration: durationJson(150),
      userId: "user-123",
      createdAt: TIMESTAMP,
      lastUpdatedAt: "2024-01-15T10:05:00+00:00",
      video: videoJson({ id: videoId, title })
    },
    rest
  )
}

export const buildVideoWatchHistory = (overrides: Json = {}): VideoWatchHistory =>
  zodParse(VideoWatchHistory, videoWatchHistoryJson(overrides))

// ---------------------------------------------------------------------------
// User & AuthenticationToken
// ---------------------------------------------------------------------------

export const userJson = (overrides: Json = {}): Json =>
  merge(
    {
      id: "user-123",
      createdAt: TIMESTAMP,
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      role: "User"
    },
    overrides
  )

export const buildUser = (overrides: Json = {}): User => zodParse(User, userJson(overrides))

export const authenticationTokenJson = (overrides: Json = {}): Json =>
  merge(
    {
      secret: "secret-token",
      expiresAt: "2099-01-15T10:00:00+00:00",
      issuedAt: TIMESTAMP,
      renewals: 0
    },
    overrides
  )

export const buildAuthenticationToken = (overrides: Json = {}): AuthenticationToken =>
  zodParse(AuthenticationToken, authenticationTokenJson(overrides))

/**
 * The persisted form, which deliberately carries no `secret`. Tests that drive session
 * expiry pass an ISO string, e.g. `DateTime.now().plus({ hours: 1 }).toISO()`.
 */
export const buildStoredAuthenticationToken = (overrides: Json = {}): StoredAuthenticationToken =>
  zodParse(StoredAuthenticationToken, authenticationTokenJson(overrides))

// ---------------------------------------------------------------------------
// Service information & health
// ---------------------------------------------------------------------------

const healthCheckStatusDetailsJson = (durationInMs: number = 10, healthStatus: string = "Healthy") =>
  ({ durationInMs, healthStatus })

export const healthCheckJson = (overrides: Json = {}): Json =>
  merge(
    {
      database: healthCheckStatusDetailsJson(),
      fileRepository: {
        imageFolder: { filePath: "/images", healthStatusDetails: healthCheckStatusDetailsJson() },
        videoFolder: { filePath: "/videos", healthStatusDetails: healthCheckStatusDetailsJson() },
        otherVideoFolders: []
      },
      keyValueStore: healthCheckStatusDetailsJson(),
      pubSub: healthCheckStatusDetailsJson(),
      spaRenderer: healthCheckStatusDetailsJson(),
      internetConnectivity: healthCheckStatusDetailsJson()
    },
    overrides
  )

export const buildHealthCheck = (overrides: Json = {}): HealthCheck =>
  zodParse(HealthCheck, healthCheckJson(overrides))

export const backendServiceInformationJson = (overrides: Json = {}): Json =>
  merge(
    {
      serviceName: "video-downloader-api",
      organization: "com.ruchij",
      scalaVersion: "3.3.1",
      sbtVersion: "1.9.7",
      javaVersion: "21",
      "yt-dlpVersion": "2024.01.01",
      currentTimestamp: TIMESTAMP,
      gitBranch: "main",
      gitCommit: "abc123",
      buildTimestamp: TIMESTAMP
    },
    overrides
  )

export const buildBackendServiceInformation = (overrides: Json = {}): BackendServiceInformation =>
  zodParse(BackendServiceInformation, backendServiceInformationJson(overrides))

export const videoServiceSummaryJson = (overrides: Json = {}): Json =>
  merge(
    {
      videoCount: 10,
      totalSize: 1024000000,
      totalDuration: durationJson(3600),
      sites: ["youtube"]
    },
    overrides
  )

export const buildVideoServiceSummary = (overrides: Json = {}): VideoServiceSummary =>
  zodParse(VideoServiceSummary, videoServiceSummaryJson(overrides))
