import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import ScheduledVideos from "~/pages/authenticated/downloading/ScheduledVideos"
import { createMemoryRouter, RouterProvider } from "react-router"
import { DateTime } from "luxon"
import { SchedulingStatus } from "~/models/SchedulingStatus"
import React from "react"
import { buildScheduledVideoDownload, durationJson, type Json } from "../fixtures"
import { triggerIntersection, withApplicationConfiguration } from "../helpers"
import { intersectionObserverCallbacks } from "../setup"

const createMockScheduledVideo = (id: string, overrides: Json = {}) =>
  buildScheduledVideoDownload({
    id,
    title: `Test Video ${id}`,
    scheduledAt: "2023-10-15T10:00:00+00:00",
    status: SchedulingStatus.Active,
    downloadedBytes: 500000000,
    videoMetadata: { duration: durationJson(300), size: 1000000000 },
    ...overrides
  })

vi.mock("~/services/scheduling/SchedulingService", () => ({
  fetchScheduledVideos: vi.fn().mockResolvedValue([]),
  scheduledVideoDownloadStream: vi.fn().mockReturnValue(() => {}),
  deleteScheduledVideoById: vi.fn().mockResolvedValue({}),
  updateSchedulingStatus: vi.fn().mockResolvedValue({}),
  retryFailedScheduledVideos: vi.fn().mockResolvedValue([]),
}))

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
}))

vi.mock("~/services/video/VideoService", () => ({
  fetchVideoSnapshotsByVideoId: vi.fn().mockResolvedValue([]),
}))

vi.mock("~/services/sanitize/SanitizationService", () => ({
  translate: vi.fn((text) => text),
}))

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>,
}))

vi.mock("~/components/scan/VideoScanButton", () => ({
  default: () => <button data-testid="scan-button">Scan</button>,
}))

const renderWithContext = () => {
  const router = createMemoryRouter([
    {
      path: "/",
      element: withApplicationConfiguration(<ScheduledVideos />),
    },
  ])

  return render(<RouterProvider router={router} />)
}

describe("ScheduledVideos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render scheduled videos page", async () => {
    renderWithContext()

    await waitFor(() => {
      expect(screen.getByTestId("scan-button")).toBeInTheDocument()
    })
  })

  test("should render retry all button", async () => {
    renderWithContext()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry All" })).toBeInTheDocument()
    })
  })

  test("should fetch scheduled videos on mount", async () => {
    const { fetchScheduledVideos } = await import("~/services/scheduling/SchedulingService")

    renderWithContext()

    await waitFor(() => {
      expect(fetchScheduledVideos).toHaveBeenCalled()
    })
  })

  test("should set up event stream on mount", async () => {
    const { scheduledVideoDownloadStream } = await import("~/services/scheduling/SchedulingService")

    renderWithContext()

    await waitFor(() => {
      expect(scheduledVideoDownloadStream).toHaveBeenCalled()
    })
  })

  test("should log stream errors via the onError callback", async () => {
    const { scheduledVideoDownloadStream } = await import("~/services/scheduling/SchedulingService")
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    let onError: (event: Event) => void
    vi.mocked(scheduledVideoDownloadStream).mockImplementation((_onProgress, _onUpdate, onStreamError) => {
      onError = onStreamError
      return () => {}
    })

    renderWithContext()

    await waitFor(() => {
      expect(scheduledVideoDownloadStream).toHaveBeenCalled()
    })

    const errorEvent = new Event("error")
    await act(async () => { onError!(errorEvent) })

    expect(consoleErrorSpy).toHaveBeenCalledWith("Scheduled video download stream error", errorEvent)

    consoleErrorSpy.mockRestore()
  })

  test("should render video cards when videos are fetched", async () => {
    const { fetchScheduledVideos } = await import("~/services/scheduling/SchedulingService")
    vi.mocked(fetchScheduledVideos).mockResolvedValue([
      createMockScheduledVideo("video-1"),
      createMockScheduledVideo("video-2"),
    ])

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
      expect(screen.getByText(/Test Video video-2/)).toBeInTheDocument()
    })
  })

  test("should show an empty message once the list has loaded with nothing in it", async () => {
    const { fetchScheduledVideos } = await import("~/services/scheduling/SchedulingService")
    vi.mocked(fetchScheduledVideos).mockResolvedValue([])

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText("Nothing is downloading")).toBeInTheDocument()
    })
  })

  test("should call retryFailedScheduledVideos when retry all is clicked", async () => {
    const { retryFailedScheduledVideos } = await import("~/services/scheduling/SchedulingService")

    renderWithContext()

    await waitFor(() => {
      const retryButton = screen.getByRole("button", { name: "Retry All" })
      fireEvent.click(retryButton)
    })

    await waitFor(() => {
      expect(retryFailedScheduledVideos).toHaveBeenCalled()
    })
  })

  test("should disable retry button while retrying", async () => {
    const { retryFailedScheduledVideos } = await import("~/services/scheduling/SchedulingService")
    let resolveRetry: () => void
    vi.mocked(retryFailedScheduledVideos).mockImplementation(() => new Promise(resolve => {
      resolveRetry = () => resolve([])
    }))

    renderWithContext()

    await waitFor(() => {
      const retryButton = screen.getByRole("button", { name: "Retry All" })
      fireEvent.click(retryButton)
    })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry All" })).toBeDisabled()
    })

    resolveRetry!()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry All" })).not.toBeDisabled()
    })
  })

  test("should show the download speed once progress updates arrive", async () => {
    const { fetchScheduledVideos, scheduledVideoDownloadStream } = await import(
      "~/services/scheduling/SchedulingService"
    )
    vi.mocked(fetchScheduledVideos).mockResolvedValue([
      createMockScheduledVideo("video-1", { lastUpdatedAt: "2023-10-15T10:00:00+00:00" })
    ])

    let onDownloadProgress: (progress: any) => void
    vi.mocked(scheduledVideoDownloadStream).mockImplementation((onProgress) => {
      onDownloadProgress = onProgress
      return () => {}
    })

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })

    // 100 MB more in 10 seconds is 10 MB/s.
    await act(async () => {
      onDownloadProgress!({
        videoId: "video-1",
        bytes: 600000000,
        updatedAt: DateTime.fromISO("2023-10-15T10:00:10+00:00"),
      })
    })

    expect(screen.getByText("10.00 MB/s")).toBeInTheDocument()
    expect(screen.getByText("60 %")).toBeInTheDocument()
  })

  test("should ignore download progress that is older than the last update", async () => {
    const { fetchScheduledVideos, scheduledVideoDownloadStream } = await import(
      "~/services/scheduling/SchedulingService"
    )
    vi.mocked(fetchScheduledVideos).mockResolvedValue([createMockScheduledVideo("video-1")])

    let onDownloadProgress: (progress: any) => void
    vi.mocked(scheduledVideoDownloadStream).mockImplementation((onProgress) => {
      onDownloadProgress = onProgress
      return () => {}
    })

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText("50 %")).toBeInTheDocument()
    })

    await act(async () => {
      onDownloadProgress!({
        videoId: "video-1",
        bytes: 400000000,
        updatedAt: DateTime.fromISO("2023-10-14T10:00:00Z"), // Older than the video's lastUpdatedAt
      })
    })

    // The bytes are adopted but no speed sample is recorded, so no rate is shown.
    expect(screen.getByText("40 %")).toBeInTheDocument()
    expect(screen.queryByText(/\/s/)).not.toBeInTheDocument()
  })

  test("should ignore download progress for non-existent video", async () => {
    const { fetchScheduledVideos, scheduledVideoDownloadStream } = await import(
      "~/services/scheduling/SchedulingService"
    )
    vi.mocked(fetchScheduledVideos).mockResolvedValue([createMockScheduledVideo("video-1")])

    let onDownloadProgress: (progress: any) => void
    vi.mocked(scheduledVideoDownloadStream).mockImplementation((onProgress) => {
      onDownloadProgress = onProgress
      return () => {}
    })

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })

    await act(async () => {
      onDownloadProgress!({
        videoId: "non-existent-video",
        bytes: 100000,
        updatedAt: DateTime.now(),
      })
    })

    expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    expect(screen.queryByText(/non-existent-video/)).not.toBeInTheDocument()
  })

  test("should remove a video from the list when a stream update marks it completed", async () => {
    const { fetchScheduledVideos, scheduledVideoDownloadStream } = await import(
      "~/services/scheduling/SchedulingService"
    )
    vi.mocked(fetchScheduledVideos).mockResolvedValue([createMockScheduledVideo("video-1")])

    let onScheduledVideoDownloadUpdate: (download: any) => void
    vi.mocked(scheduledVideoDownloadStream).mockImplementation((_, onUpdate) => {
      onScheduledVideoDownloadUpdate = onUpdate
      return () => {}
    })

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })

    await act(async () => {
      onScheduledVideoDownloadUpdate!(createMockScheduledVideo("video-1", { status: SchedulingStatus.Completed }))
    })

    await waitFor(() => {
      expect(screen.queryByText(/Test Video video-1/)).not.toBeInTheDocument()
    })
  })

  test("should update video status when action button is clicked", async () => {
    const { fetchScheduledVideos, updateSchedulingStatus } = await import(
      "~/services/scheduling/SchedulingService"
    )

    vi.mocked(fetchScheduledVideos).mockResolvedValue([createMockScheduledVideo("video-1")])
    vi.mocked(updateSchedulingStatus).mockResolvedValue(
      createMockScheduledVideo("video-1", { status: SchedulingStatus.Paused })
    )

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Pause" }))

    await waitFor(() => {
      expect(updateSchedulingStatus).toHaveBeenCalledWith("video-1", SchedulingStatus.Paused)
    })
  })

  test("should update downloadable scheduled videos state after status update", async () => {
    const { fetchScheduledVideos, updateSchedulingStatus } = await import(
      "~/services/scheduling/SchedulingService"
    )

    vi.mocked(fetchScheduledVideos).mockResolvedValue([
      createMockScheduledVideo("video-1", { status: SchedulingStatus.Paused })
    ])
    vi.mocked(updateSchedulingStatus).mockResolvedValue(
      createMockScheduledVideo("video-1", { status: SchedulingStatus.Queued })
    )

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
      expect(screen.getByText("Paused")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Resume" }))

    await waitFor(() => {
      expect(updateSchedulingStatus).toHaveBeenCalledWith("video-1", SchedulingStatus.Queued)
    })

    await waitFor(() => {
      expect(screen.getByText("Queued")).toBeInTheDocument()
    })
  })

  test("should tell the user when a status update fails", async () => {
    const { fetchScheduledVideos, updateSchedulingStatus } = await import(
      "~/services/scheduling/SchedulingService"
    )
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    vi.mocked(fetchScheduledVideos).mockResolvedValue([createMockScheduledVideo("video-1")])
    vi.mocked(updateSchedulingStatus).mockRejectedValue(new Error("Update failed"))

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Pause" }))

    // Without a provider the notification degrades to a console error; the status is unchanged.
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to update the download status", expect.any(Error))
    })
    expect(screen.getByText("Active")).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })

  test("should handle video removal when status becomes Deleted via stream update", async () => {
    const { fetchScheduledVideos, scheduledVideoDownloadStream } = await import(
      "~/services/scheduling/SchedulingService"
    )
    vi.mocked(fetchScheduledVideos).mockResolvedValue([createMockScheduledVideo("video-1")])

    let onScheduledVideoDownloadUpdate: (download: any) => void
    vi.mocked(scheduledVideoDownloadStream).mockImplementation((_, onUpdate) => {
      onScheduledVideoDownloadUpdate = onUpdate
      return () => {}
    })

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })

    await act(async () => {
      onScheduledVideoDownloadUpdate!(createMockScheduledVideo("video-1", { status: SchedulingStatus.Deleted }))
    })

    await waitFor(() => {
      expect(screen.queryByText(/Test Video video-1/)).not.toBeInTheDocument()
    })
  })

  test("should update video in list when stream update has non-terminal status", async () => {
    const { fetchScheduledVideos, scheduledVideoDownloadStream } = await import(
      "~/services/scheduling/SchedulingService"
    )
    vi.mocked(fetchScheduledVideos).mockResolvedValue([createMockScheduledVideo("video-1")])

    let onScheduledVideoDownloadUpdate: (download: any) => void
    vi.mocked(scheduledVideoDownloadStream).mockImplementation((_, onUpdate) => {
      onScheduledVideoDownloadUpdate = onUpdate
      return () => {}
    })

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
      expect(screen.getByText("Active")).toBeInTheDocument()
    })

    await act(async () => {
      onScheduledVideoDownloadUpdate!(createMockScheduledVideo("video-1", { status: SchedulingStatus.Paused }))
    })

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
      expect(screen.getByText("Paused")).toBeInTheDocument()
    })
  })

  test("should handle retry action from error status", async () => {
    const { fetchScheduledVideos, updateSchedulingStatus } = await import(
      "~/services/scheduling/SchedulingService"
    )

    vi.mocked(fetchScheduledVideos).mockResolvedValue([
      createMockScheduledVideo("video-1", {
        status: SchedulingStatus.Error,
        errorInfo: { message: "Download failed", details: "" },
      })
    ])
    vi.mocked(updateSchedulingStatus).mockResolvedValue(
      createMockScheduledVideo("video-1", { status: SchedulingStatus.Queued })
    )

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Retry" }))

    await waitFor(() => {
      expect(updateSchedulingStatus).toHaveBeenCalledWith("video-1", SchedulingStatus.Queued)
    })
  })

  test("should delete the scheduled video when the card's delete is confirmed", async () => {
    const { fetchScheduledVideos, deleteScheduledVideoById } = await import(
      "~/services/scheduling/SchedulingService"
    )
    vi.mocked(fetchScheduledVideos).mockResolvedValue([createMockScheduledVideo("video-1")])

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Delete scheduled video" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(deleteScheduledVideoById).toHaveBeenCalledWith("video-1")
    })
  })

  describe("Pagination", () => {
    beforeEach(() => {
      intersectionObserverCallbacks.length = 0
    })

    test("should fetch the next page when scroll trigger intersects", async () => {
      const { fetchScheduledVideos } = await import("~/services/scheduling/SchedulingService")
      const fullPage = Array.from({ length: 50 }, (_, i) =>
        createMockScheduledVideo(`page0-${i}`)
      )

      vi.mocked(fetchScheduledVideos)
        .mockResolvedValueOnce(fullPage)
        .mockResolvedValueOnce([createMockScheduledVideo("page1-video")])

      renderWithContext()

      await waitFor(() => {
        expect(screen.getByText(/Test Video page0-0/)).toBeInTheDocument()
      })
      expect(vi.mocked(fetchScheduledVideos)).toHaveBeenCalledTimes(1)

      await triggerIntersection()

      await waitFor(() => {
        expect(vi.mocked(fetchScheduledVideos)).toHaveBeenCalledTimes(2)
      })

      await waitFor(() => {
        expect(screen.getByText(/Test Video page1-video/)).toBeInTheDocument()
      })
    })

    test("should not fetch more when results are less than page size", async () => {
      const { fetchScheduledVideos } = await import("~/services/scheduling/SchedulingService")
      vi.mocked(fetchScheduledVideos).mockResolvedValue([
        createMockScheduledVideo("only-video"),
      ])

      renderWithContext()

      await waitFor(() => {
        expect(screen.getByText(/Test Video only-video/)).toBeInTheDocument()
      })

      const callsBefore = vi.mocked(fetchScheduledVideos).mock.calls.length
      await triggerIntersection()
      expect(vi.mocked(fetchScheduledVideos).mock.calls.length).toBe(callsBefore)
    })
  })
})
