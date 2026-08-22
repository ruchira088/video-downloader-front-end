import { describe, expect, test } from "vitest"
import { DateTime, Duration } from "luxon"
import {
  buildAuthenticationToken,
  buildBackendServiceInformation,
  buildDownloadableScheduledVideo,
  buildHealthCheck,
  buildPlaylist,
  buildScheduledVideoDownload,
  buildSnapshot,
  buildUser,
  buildVideo,
  buildVideoMetadata,
  buildVideoServiceSummary,
  buildVideoWatchHistory,
  durationJson,
  videoJson
} from "./fixtures"

// The builders parse their wire fixtures with the real schemas, so this suite is what
// turns a model change into a clear failure here rather than a puzzling one elsewhere.
describe("fixtures", () => {
  test("every builder produces a value its schema accepts", () => {
    expect(() => {
      buildVideoMetadata()
      buildVideo()
      buildSnapshot()
      buildPlaylist()
      buildScheduledVideoDownload()
      buildDownloadableScheduledVideo()
      buildVideoWatchHistory()
      buildUser()
      buildAuthenticationToken()
      buildHealthCheck()
      buildBackendServiceInformation()
      buildVideoServiceSummary()
    }).not.toThrow()
  })

  test("should decode wire types into the domain types the app renders", () => {
    const video = buildVideo()

    expect(video.createdAt).toBeInstanceOf(DateTime)
    expect(video.watchTime).toBeInstanceOf(Duration)
    expect(video.videoMetadata.duration).toBeInstanceOf(Duration)
    // The `type` discriminator comes from the schema transform, never from the fixture.
    expect(video.fileResource.type).toBe("video")
    expect(video.videoMetadata.thumbnail.type).toBe("thumbnail")
  })

  test("should apply the id and title shorthands throughout the graph", () => {
    const video = buildVideo({ id: "video-1", title: "Cats" })

    expect(video.videoMetadata.id).toBe("video-1")
    expect(video.videoMetadata.title).toBe("Cats")
    expect(video.fileResource.id).toBe("file-video-1")
    expect(video.videoMetadata.thumbnail.id).toBe("thumb-video-1")
  })

  test("should deep-merge overrides rather than replacing whole branches", () => {
    const video = buildVideo({ id: "video-1", videoMetadata: { duration: durationJson(45) } })

    expect(video.videoMetadata.duration.as("seconds")).toBe(45)
    // Untouched siblings survive the merge.
    expect(video.videoMetadata.id).toBe("video-1")
    expect(video.videoMetadata.thumbnail.id).toBe("thumb-video-1")
  })

  test("should replace arrays and nulls wholesale", () => {
    const playlist = buildPlaylist({ videos: [videoJson({ id: "video-1" })] })

    expect(playlist.videos).toHaveLength(1)
    expect(playlist.albumArt.isEmpty()).toBe(true)
  })

  test("should keep an Option field empty when the wire value is null", () => {
    expect(buildScheduledVideoDownload().completedAt.isEmpty()).toBe(true)
    expect(buildScheduledVideoDownload({ completedAt: "2024-02-01T10:00:00+00:00" }).completedAt.isEmpty()).toBe(false)
  })

  test("should combine both halves of a downloadable scheduled video", () => {
    const downloadable = buildDownloadableScheduledVideo({ id: "video-1", downloadedBytes: 500 })

    expect(downloadable.videoMetadata.id).toBe("video-1")
    expect(downloadable.downloadedBytes).toBe(500)
    expect(downloadable.downloadHistory).toEqual([])
  })
})
