import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import DownloadInformation from "~/pages/authenticated/downloading/scheduled-video-download-card/DownloadInformation"
import { DateTime, Duration } from "luxon"
import { None, Some } from "~/types/Option"
import React from "react"

const createMockDownloadableScheduledVideo = (downloadSpeed: number | null) => ({
  lastUpdatedAt: DateTime.now(),
  scheduledAt: DateTime.now(),
  videoMetadata: {
    url: "https://example.com/video",
    id: "video-123",
    videoSite: "youtube",
    title: "Test Video",
    duration: Duration.fromObject({ minutes: 5 }),
    size: 1000000000, // 1GB
    thumbnail: {
      id: "thumb-123",
      type: "thumbnail" as const,
      createdAt: DateTime.now(),
      path: "/path/to/thumb",
      mediaType: "image/jpeg",
      size: 1024,
    },
  },
  status: "Active" as const,
  downloadedBytes: 500000000, // 500MB downloaded
  completedAt: None.of<DateTime>(),
  errorInfo: null,
  downloadSpeed: downloadSpeed !== null ? Some.of(downloadSpeed) : None.of<number>(),
  downloadHistory: [],
})

describe("DownloadInformation", () => {
  test("should render download speed when available", () => {
    const video = createMockDownloadableScheduledVideo(1000000) // 1MB/s

    render(<DownloadInformation downloadableScheduledVideo={video} />)

    // The humanReadableSize function uses kB format and outputs in separate elements
    expect(screen.getByText(/1000\.00 kB/)).toBeInTheDocument()
    expect(screen.getByText(/\/s/)).toBeInTheDocument()
  })

  test("should render remaining time estimate", () => {
    const video = createMockDownloadableScheduledVideo(1000000) // 1MB/s with 500MB remaining = 500s

    render(<DownloadInformation downloadableScheduledVideo={video} />)

    // 500MB remaining / 1MB/s = 500 seconds = ~8 minutes
    expect(screen.getByText(/8 minutes/)).toBeInTheDocument()
  })

  test("should return null when download speed is not available", () => {
    const video = createMockDownloadableScheduledVideo(null)

    const { container } = render(<DownloadInformation downloadableScheduledVideo={video} />)

    expect(container.firstChild).toBeNull()
  })

  test("should return null when download speed is 0", () => {
    const video = createMockDownloadableScheduledVideo(0)

    const { container } = render(<DownloadInformation downloadableScheduledVideo={video} />)

    expect(container.firstChild).toBeNull()
  })

  test("should handle high download speeds", () => {
    const video = createMockDownloadableScheduledVideo(100000000) // 100MB/s

    render(<DownloadInformation downloadableScheduledVideo={video} />)

    expect(screen.getByText(/100\.00 MB\/s/)).toBeInTheDocument()
  })

  test("should handle low download speeds", () => {
    const video = createMockDownloadableScheduledVideo(1000) // 1KB/s

    render(<DownloadInformation downloadableScheduledVideo={video} />)

    expect(screen.getByText(/1000\.00 B/)).toBeInTheDocument()
    expect(screen.getByText(/\/s/)).toBeInTheDocument()
  })

  test("should calculate remaining time correctly", () => {
    // 100MB remaining at 10MB/s = 10 seconds
    const video = {
      ...createMockDownloadableScheduledVideo(10000000), // 10MB/s
      videoMetadata: {
        ...createMockDownloadableScheduledVideo(10000000).videoMetadata,
        size: 200000000, // 200MB total
      },
      downloadedBytes: 100000000, // 100MB downloaded
    }

    render(<DownloadInformation downloadableScheduledVideo={video} />)

    expect(screen.getByText(/10 seconds/)).toBeInTheDocument()
  })
})
