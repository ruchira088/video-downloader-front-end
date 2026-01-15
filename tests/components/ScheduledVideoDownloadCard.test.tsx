import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ScheduledVideoDownloadCard from "~/pages/authenticated/downloading/scheduled-video-download-card/ScheduledVideoDownloadCard"
import { DateTime, Duration } from "luxon"
import { None, Some } from "~/types/Option"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { SchedulingStatus } from "~/models/SchedulingStatus"
import { FileResourceType } from "~/models/FileResource"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
}))

vi.mock("~/services/video/VideoService", () => ({
  fetchVideoSnapshotsByVideoId: vi.fn().mockResolvedValue([]),
}))

vi.mock("~/services/sanitize/SanitizationService", () => ({
  translate: vi.fn((text) => text),
}))

const createMockDownloadableScheduledVideo = (status: SchedulingStatus = SchedulingStatus.Active) => ({
  lastUpdatedAt: DateTime.now(),
  scheduledAt: DateTime.fromISO("2023-10-15T10:00:00Z"),
  videoMetadata: {
    url: "https://example.com/video",
    id: "video-123",
    videoSite: "youtube",
    title: "Test Video Title",
    duration: Duration.fromObject({ minutes: 5 }),
    size: 1000000000,
    thumbnail: {
      id: "thumb-123",
      type: FileResourceType.Thumbnail as const,
      createdAt: DateTime.now(),
      path: "/path/to/thumb",
      mediaType: "image/jpeg",
      size: 1024,
    },
  },
  status,
  downloadedBytes: 500000000,
  completedAt: None.of<DateTime>(),
  errorInfo: status === SchedulingStatus.Error ? { message: "Download failed", stackTrace: ["Connection timeout"] } : null,
  downloadSpeed: Some.of(1000000),
  downloadHistory: [100000, 200000, 300000],
})

const renderWithContext = (
  downloadableScheduledVideo = createMockDownloadableScheduledVideo(),
  onDelete = vi.fn().mockResolvedValue(undefined),
  onUpdateStatus = vi.fn().mockResolvedValue(undefined)
) => {
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
          <ScheduledVideoDownloadCard
            downloadableScheduledVideo={downloadableScheduledVideo}
            onDelete={onDelete}
            onUpdateStatus={onUpdateStatus}
          />
        </ApplicationConfigurationContext.Provider>
      ),
    },
  ])

  return render(<RouterProvider router={router} />)
}

describe("ScheduledVideoDownloadCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render video metadata card", () => {
    renderWithContext()

    expect(screen.getByAltText("video thumbnail")).toBeInTheDocument()
  })

  test("should render download progress", () => {
    renderWithContext()

    expect(screen.getByText("50 %")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  test("should render status", () => {
    renderWithContext()

    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  test("should render delete button", () => {
    renderWithContext()

    expect(screen.getByText("X")).toBeInTheDocument()
  })

  test("should open delete dialog when X is clicked", () => {
    renderWithContext()

    fireEvent.click(screen.getByText("X"))

    expect(screen.getByText("Delete Scheduled Video?")).toBeInTheDocument()
  })

  test("should call onDelete when delete is confirmed", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    renderWithContext(createMockDownloadableScheduledVideo(), onDelete)

    fireEvent.click(screen.getByText("X"))
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalled()
    })
  })

  test("should close delete dialog when cancel is clicked", async () => {
    renderWithContext()

    fireEvent.click(screen.getByText("X"))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    await waitFor(() => {
      expect(screen.queryByText("Delete Scheduled Video?")).not.toBeInTheDocument()
    })
  })

  test("should render pause button for active status", () => {
    renderWithContext(createMockDownloadableScheduledVideo(SchedulingStatus.Active))

    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument()
  })

  test("should render resume button for paused status", () => {
    renderWithContext(createMockDownloadableScheduledVideo(SchedulingStatus.Paused))

    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument()
  })

  test("should call onUpdateStatus when action button is clicked", async () => {
    const onUpdateStatus = vi.fn().mockResolvedValue(undefined)
    renderWithContext(createMockDownloadableScheduledVideo(SchedulingStatus.Active), vi.fn(), onUpdateStatus)

    fireEvent.click(screen.getByRole("button", { name: "Pause" }))

    await waitFor(() => {
      expect(onUpdateStatus).toHaveBeenCalledWith(SchedulingStatus.Paused)
    })
  })

  test("should show error details link for error status", () => {
    renderWithContext(createMockDownloadableScheduledVideo(SchedulingStatus.Error))

    expect(screen.getByText("Error Details")).toBeInTheDocument()
  })

  test("should open error dialog when error details is clicked", () => {
    renderWithContext(createMockDownloadableScheduledVideo(SchedulingStatus.Error))

    fireEvent.click(screen.getByText("Error Details"))

    // Check that dialog opened with error message
    expect(screen.getByText("Download failed")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
  })

  test("should render retry button in error dialog", () => {
    renderWithContext(createMockDownloadableScheduledVideo(SchedulingStatus.Error))

    fireEvent.click(screen.getByText("Error Details"))

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
  })

  test("should call onUpdateStatus with Queued when retry is clicked", async () => {
    const onUpdateStatus = vi.fn().mockResolvedValue(undefined)
    renderWithContext(createMockDownloadableScheduledVideo(SchedulingStatus.Error), vi.fn(), onUpdateStatus)

    fireEvent.click(screen.getByText("Error Details"))
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))

    await waitFor(() => {
      expect(onUpdateStatus).toHaveBeenCalledWith(SchedulingStatus.Queued)
    })
  })

  test("should render timestamp", () => {
    renderWithContext()

    expect(screen.getByText(/2023/)).toBeInTheDocument()
  })

  test("should enable source link in video metadata card", () => {
    renderWithContext()

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "https://example.com/video")
  })
})
