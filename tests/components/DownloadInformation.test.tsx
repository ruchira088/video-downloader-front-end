import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import DownloadInformation from "~/pages/authenticated/downloading/scheduled-video-download-card/DownloadInformation"
import { SchedulingStatus } from "~/models/SchedulingStatus"
import React from "react"
import { buildDownloadableScheduledVideo, durationJson } from "../fixtures"

const createMockDownloadableScheduledVideo = (downloadSpeed: number | null) =>
  buildDownloadableScheduledVideo({
    status: SchedulingStatus.Active,
    // 500MB of a 1GB download, so "remaining" arithmetic is easy to read in assertions.
    downloadedBytes: 500000000,
    downloadSpeed,
    videoMetadata: {
      url: "https://example.com/video",
      duration: durationJson(300),
      size: 1000000000
    }
  })

describe("DownloadInformation", () => {
  test("should render download speed when available", () => {
    const video = createMockDownloadableScheduledVideo(1000000) // 1MB/s

    render(<DownloadInformation downloadableScheduledVideo={video} />)

    // 1,000,000 B/s is exactly the MB boundary
    expect(screen.getByText(/1\.00 MB/)).toBeInTheDocument()
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

    // 1000 B/s is exactly the kB boundary
    expect(screen.getByText(/1\.00 kB/)).toBeInTheDocument()
    expect(screen.getByText(/\/s/)).toBeInTheDocument()
  })

  test("should calculate remaining time correctly", () => {
    // 100MB remaining at 10MB/s = 10 seconds
    const video = buildDownloadableScheduledVideo({
      status: SchedulingStatus.Active,
      downloadSpeed: 10000000, // 10MB/s
      downloadedBytes: 100000000, // 100MB downloaded
      videoMetadata: { size: 200000000 } // 200MB total
    })

    render(<DownloadInformation downloadableScheduledVideo={video} />)

    expect(screen.getByText(/10 seconds/)).toBeInTheDocument()
  })
})
