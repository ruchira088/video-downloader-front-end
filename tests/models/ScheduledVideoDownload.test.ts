import { describe, expect, test } from "vitest"
import { ScheduledVideoDownload } from "~/models/ScheduledVideoDownload"
import { DateTime, Duration } from "luxon"

describe("ScheduledVideoDownload", () => {
  const createValidData = () => ({
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
    status: "Queued",
    downloadedBytes: 0,
  })

  test("should parse valid scheduled video download", () => {
    const data = createValidData()

    const result = ScheduledVideoDownload.parse(data)

    expect(result.status).toBe("Queued")
    expect(result.downloadedBytes).toBe(0)
    expect(result.videoMetadata.title).toBe("Test Video")
    expect(result.lastUpdatedAt).toBeInstanceOf(DateTime)
    expect(result.scheduledAt).toBeInstanceOf(DateTime)
  })

  test("should handle completedAt when provided", () => {
    const data = {
      ...createValidData(),
      status: "Completed",
      completedAt: "2023-10-15T11:00:00Z",
    }

    const result = ScheduledVideoDownload.parse(data)

    expect(result.completedAt.isEmpty()).toBe(false)
  })

  test("should handle completedAt as None when not provided", () => {
    const data = createValidData()

    const result = ScheduledVideoDownload.parse(data)

    expect(result.completedAt.isEmpty()).toBe(true)
  })

  test("should parse error info when provided", () => {
    const data = {
      ...createValidData(),
      status: "Error",
      errorInfo: {
        message: "Download failed",
        details: "Connection timeout\nRetry failed",
      },
    }

    const result = ScheduledVideoDownload.parse(data)

    expect(result.errorInfo).not.toBeNull()
    expect(result.errorInfo?.message).toBe("Download failed")
  })

  test("should handle all scheduling statuses", () => {
    const statuses = ["Queued", "Completed", "Downloaded", "WorkersPaused", "Error", "Active", "Stale", "Acquired", "Paused", "Deleted"]

    statuses.forEach((status) => {
      const data = { ...createValidData(), status }
      const result = ScheduledVideoDownload.parse(data)
      expect(result.status).toBe(status)
    })
  })

  test("should track downloaded bytes", () => {
    const data = {
      ...createValidData(),
      downloadedBytes: 512000,
    }

    const result = ScheduledVideoDownload.parse(data)

    expect(result.downloadedBytes).toBe(512000)
  })
})
