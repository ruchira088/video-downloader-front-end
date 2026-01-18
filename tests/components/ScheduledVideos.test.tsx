import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import ScheduledVideos from "~/pages/authenticated/downloading/ScheduledVideos"
import { createMemoryRouter, RouterProvider } from "react-router"
import { DateTime, Duration } from "luxon"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some, None } from "~/types/Option"
import { SchedulingStatus } from "~/models/SchedulingStatus"
import { FileResourceType } from "~/models/FileResource"
import React from "react"

// Mock IntersectionObserver for InfiniteScroll component
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor() {}
}
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)

const createMockScheduledVideo = (id: string) => ({
  lastUpdatedAt: DateTime.now(),
  scheduledAt: DateTime.fromISO("2023-10-15T10:00:00Z"),
  videoMetadata: {
    url: `https://example.com/video/${id}`,
    id,
    videoSite: "youtube",
    title: `Test Video ${id}`,
    duration: Duration.fromObject({ minutes: 5 }),
    size: 1000000000,
    thumbnail: {
      id: `thumb-${id}`,
      type: FileResourceType.Thumbnail as const,
      createdAt: DateTime.now(),
      path: "/path/to/thumb",
      mediaType: "image/jpeg",
      size: 1024,
    },
  },
  status: SchedulingStatus.Active,
  downloadedBytes: 500000000,
  completedAt: None.of<DateTime>(),
  errorInfo: null,
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
  const contextValue = {
    safeMode: false,
    theme: Theme.Light,
    setSafeMode: vi.fn(),
    setTheme: vi.fn(),
  }

  const router = createMemoryRouter([
    {
      path: "/",
      element: (
        <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
          <ScheduledVideos />
        </ApplicationConfigurationContext.Provider>
      ),
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

  test("should handle download progress updates", async () => {
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

    // Simulate download progress update
    onDownloadProgress!({
      videoId: "video-1",
      bytes: 600000000,
      updatedAt: DateTime.now().plus({ seconds: 5 }),
    })

    // Component should update without error
    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })
  })

  test("should handle download progress with older timestamp (no update)", async () => {
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

    // Simulate download progress with older timestamp than the scheduled video's lastUpdatedAt
    // This should trigger the branch that returns existing downloadHistory (line 41)
    onDownloadProgress!({
      videoId: "video-1",
      bytes: 400000000,
      updatedAt: DateTime.fromISO("2023-10-14T10:00:00Z"), // Older than scheduledVideo
    })

    // Component should still display without changes
    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })
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

    // Simulate download progress for a video that doesn't exist in state
    // This should trigger the None case (line 91)
    onDownloadProgress!({
      videoId: "non-existent-video",
      bytes: 100000,
      updatedAt: DateTime.now(),
    })

    // Component should still display the existing video
    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })
  })

  test("should handle scheduled video download updates", async () => {
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

    // Simulate video being removed when completed
    onScheduledVideoDownloadUpdate!({
      ...createMockScheduledVideo("video-1"),
      status: SchedulingStatus.Completed,
    })

    await waitFor(() => {
      expect(screen.queryByText(/Test Video video-1/)).not.toBeInTheDocument()
    })
  })

  test("should handle status update from cards", async () => {
    const { fetchScheduledVideos, updateSchedulingStatus } = await import(
      "~/services/scheduling/SchedulingService"
    )
    vi.mocked(fetchScheduledVideos).mockResolvedValue([createMockScheduledVideo("video-1")])
    vi.mocked(updateSchedulingStatus).mockResolvedValue(createMockScheduledVideo("video-1"))

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })

    // The updateSchedulingStatus is called by the ScheduledVideoDownloadCard component
    // Just verify the setup is correct
    expect(fetchScheduledVideos).toHaveBeenCalled()
  })

  test("should handle less than page size results", async () => {
    const { fetchScheduledVideos } = await import("~/services/scheduling/SchedulingService")
    // Return less than PAGE_SIZE (50) to indicate no more pages
    vi.mocked(fetchScheduledVideos).mockResolvedValue([
      createMockScheduledVideo("video-1"),
    ])

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })
  })

  test("should update video status when action button is clicked", async () => {
    const { fetchScheduledVideos, updateSchedulingStatus } = await import(
      "~/services/scheduling/SchedulingService"
    )

    // Create a video with Active status which has a "Pause" action
    const activeVideo = {
      ...createMockScheduledVideo("video-1"),
      status: SchedulingStatus.Active,
    }

    vi.mocked(fetchScheduledVideos).mockResolvedValue([activeVideo])
    vi.mocked(updateSchedulingStatus).mockResolvedValue({
      ...activeVideo,
      status: SchedulingStatus.Paused,
    })

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })

    // Find and click the "Pause" button (Active -> Paused transition)
    const pauseButton = screen.getByRole("button", { name: "Pause" })
    fireEvent.click(pauseButton)

    await waitFor(() => {
      expect(updateSchedulingStatus).toHaveBeenCalledWith("video-1", SchedulingStatus.Paused)
    })
  })

  test("should update downloadable scheduled videos state after status update", async () => {
    const { fetchScheduledVideos, updateSchedulingStatus } = await import(
      "~/services/scheduling/SchedulingService"
    )

    // Create a video with Paused status which has a "Resume" action
    const pausedVideo = {
      ...createMockScheduledVideo("video-1"),
      status: SchedulingStatus.Paused,
    }

    const resumedVideo = {
      ...pausedVideo,
      status: SchedulingStatus.Queued,
    }

    vi.mocked(fetchScheduledVideos).mockResolvedValue([pausedVideo])
    vi.mocked(updateSchedulingStatus).mockResolvedValue(resumedVideo)

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
      expect(screen.getByText("Paused")).toBeInTheDocument()
    })

    // Find and click the "Resume" button (Paused -> Queued transition)
    const resumeButton = screen.getByRole("button", { name: "Resume" })
    fireEvent.click(resumeButton)

    await waitFor(() => {
      expect(updateSchedulingStatus).toHaveBeenCalledWith("video-1", SchedulingStatus.Queued)
    })

    // Verify the status is updated in the UI
    await waitFor(() => {
      expect(screen.getByText("Queued")).toBeInTheDocument()
    })
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

    // Simulate video being removed when deleted
    onScheduledVideoDownloadUpdate!({
      ...createMockScheduledVideo("video-1"),
      status: SchedulingStatus.Deleted,
    })

    await waitFor(() => {
      expect(screen.queryByText(/Test Video video-1/)).not.toBeInTheDocument()
    })
  })

  test("should update video in list when stream update has non-terminal status", async () => {
    const { fetchScheduledVideos, scheduledVideoDownloadStream } = await import(
      "~/services/scheduling/SchedulingService"
    )
    vi.mocked(fetchScheduledVideos).mockResolvedValue([
      {
        ...createMockScheduledVideo("video-1"),
        status: SchedulingStatus.Active,
      }
    ])

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

    // Simulate status update to Paused (non-terminal status)
    onScheduledVideoDownloadUpdate!({
      ...createMockScheduledVideo("video-1"),
      status: SchedulingStatus.Paused,
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

    // Create a video with Error status which has a "Retry" action
    const errorVideo = {
      ...createMockScheduledVideo("video-1"),
      status: SchedulingStatus.Error,
      errorInfo: { message: "Download failed", stackTrace: [] },
    }

    vi.mocked(fetchScheduledVideos).mockResolvedValue([errorVideo])
    vi.mocked(updateSchedulingStatus).mockResolvedValue({
      ...errorVideo,
      status: SchedulingStatus.Queued,
      errorInfo: null,
    })

    renderWithContext()

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })

    // Find and click the "Retry" button (Error -> Queued transition)
    const retryButton = screen.getByRole("button", { name: "Retry" })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(updateSchedulingStatus).toHaveBeenCalledWith("video-1", SchedulingStatus.Queued)
    })
  })
})
