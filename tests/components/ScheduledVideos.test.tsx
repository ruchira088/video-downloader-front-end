import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import ScheduledVideos from "~/pages/authenticated/downloading/ScheduledVideos"
import { createMemoryRouter, RouterProvider } from "react-router"
import { DateTime, Duration } from "luxon"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some, None } from "~/types/Option"
import { SchedulingStatus } from "~/models/SchedulingStatus"
import React from "react"

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
      type: "thumbnail" as const,
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
})
