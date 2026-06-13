import { describe, expect, test } from "vitest"
import type { DownloadableScheduledVideo } from "~/models/DownloadableScheduledVideo"
import { Downloadable } from "~/models/DownloadableScheduledVideo"
import { ScheduledVideoDownload } from "~/models/ScheduledVideoDownload"
import { DateTime } from "luxon"

describe("Downloadable", () => {
  test("should parse valid downloadable data", () => {
    const data = {
      downloadedBytes: 1024000,
      lastUpdatedAt: "2023-10-15T10:30:00Z",
      downloadHistory: [100, 200, 300, 400, 500],
    }

    const result = Downloadable.parse(data)

    expect(result.downloadedBytes).toBe(1024000)
    expect(result.lastUpdatedAt).toBeInstanceOf(DateTime)
    expect(result.downloadHistory).toEqual([100, 200, 300, 400, 500])
  })

  test("should handle optional downloadSpeed", () => {
    const data = {
      downloadedBytes: 1024000,
      lastUpdatedAt: "2023-10-15T10:30:00Z",
      downloadHistory: [],
      downloadSpeed: 50000,
    }

    const result = Downloadable.parse(data)

    expect(result.downloadSpeed.isEmpty()).toBe(false)
  })

  test("should handle missing downloadSpeed as None", () => {
    const data = {
      downloadedBytes: 0,
      lastUpdatedAt: "2023-10-15T10:30:00Z",
      downloadHistory: [],
    }

    const result = Downloadable.parse(data)

    expect(result.downloadSpeed.isEmpty()).toBe(true)
  })

  test("should handle empty downloadHistory array", () => {
    const data = {
      downloadedBytes: 0,
      lastUpdatedAt: "2023-10-15T10:30:00Z",
      downloadHistory: [],
    }

    const result = Downloadable.parse(data)

    expect(result.downloadHistory).toEqual([])
  })

  test("should handle large download history", () => {
    const history = Array.from({ length: 100 }, (_, i) => i * 1000)
    const data = {
      downloadedBytes: 99000,
      lastUpdatedAt: "2023-10-15T10:30:00Z",
      downloadHistory: history,
    }

    const result = Downloadable.parse(data)

    expect(result.downloadHistory).toHaveLength(100)
  })

  test("should throw on missing required fields", () => {
    const data = {
      downloadedBytes: 0,
      // missing lastUpdatedAt and downloadHistory
    }

    expect(() => Downloadable.parse(data)).toThrow()
  })
})

describe("DownloadableScheduledVideo", () => {
  test("should be the intersection of Downloadable and ScheduledVideoDownload", () => {
    const downloadable = Downloadable.parse({
      downloadedBytes: 1024000,
      lastUpdatedAt: "2023-10-15T10:30:00Z",
      downloadHistory: [100, 200, 300],
    })

    const scheduledVideoDownload = ScheduledVideoDownload.parse({
      lastUpdatedAt: "2023-10-15T10:30:00Z",
      scheduledAt: "2023-10-15T10:00:00Z",
      videoMetadata: {
        url: "https://example.com/video",
        id: "video-123",
        videoSite: "youtube",
        title: "Test Video",
        duration: { length: 300, unit: "seconds" },
        size: 1024000,
        thumbnail: {
          id: "thumb-123",
          createdAt: "2023-10-15T09:00:00Z",
          path: "/path/to/thumb",
          mediaType: "image/jpeg",
          size: 1024,
        },
      },
      status: "Active",
      downloadedBytes: 1024000,
    })

    const downloadableScheduledVideo: DownloadableScheduledVideo = {
      ...scheduledVideoDownload,
      ...downloadable,
    }

    expect(downloadableScheduledVideo.downloadHistory).toEqual([100, 200, 300])
    expect(downloadableScheduledVideo.videoMetadata.id).toBe("video-123")
    expect(downloadableScheduledVideo.lastUpdatedAt).toBeInstanceOf(DateTime)
    expect(downloadableScheduledVideo.scheduledAt).toBeInstanceOf(DateTime)
  })
})
