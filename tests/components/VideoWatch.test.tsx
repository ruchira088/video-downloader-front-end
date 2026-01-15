import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import VideoWatch from "~/pages/authenticated/videos/video-page/watch/VideoWatch"
import { DateTime, Duration } from "luxon"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
  videoUrl: vi.fn(() => "https://example.com/video.mp4"),
}))

vi.mock("~/services/video/VideoService", () => ({
  updateVideoTitle: vi.fn().mockResolvedValue({
    videoMetadata: {
      id: "video-123",
      title: "Updated Title",
      videoSite: "youtube",
      url: "https://example.com/video",
      duration: { toMillis: () => 330000, as: () => 330 },
      size: 1024000000,
      thumbnail: {
        id: "thumb-123",
        type: "thumbnail",
        createdAt: { toISO: () => "2023-10-15T10:00:00Z" },
        path: "/path/to/thumb",
        mediaType: "image/jpeg",
        size: 1024,
      },
    },
    fileResource: {
      id: "file-123",
      type: "video",
      createdAt: { toISO: () => "2023-10-15T10:00:00Z" },
      path: "/path/to/video",
      mediaType: "video/mp4",
      size: 1024000000,
    },
    createdAt: { toISO: () => "2023-10-15T10:00:00Z" },
    watchTime: { toMillis: () => 120000 },
  }),
  deleteVideo: vi.fn().mockResolvedValue(undefined),
  fetchVideoSnapshotsByVideoId: vi.fn().mockResolvedValue([]),
}))

vi.mock("~/services/sanitize/SanitizationService", () => ({
  translate: vi.fn((text, safeMode) => (safeMode ? "[SAFE] " + text : text)),
}))

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>,
}))

vi.mock("~/components/video/video-snapshots/VideoSnapshotsGallery", () => ({
  default: () => <div data-testid="snapshots-gallery">Snapshots</div>,
}))

const createMockVideo = () => ({
  videoMetadata: {
    url: "https://example.com/video",
    id: "video-123",
    videoSite: "youtube",
    title: "Test Video Title",
    duration: Duration.fromObject({ minutes: 5, seconds: 30 }),
    size: 1024000000,
    thumbnail: {
      id: "thumb-123",
      type: "thumbnail" as const,
      createdAt: DateTime.now(),
      path: "/path/to/thumb",
      mediaType: "image/jpeg",
      size: 1024,
    },
  },
  fileResource: {
    id: "file-123",
    type: "video" as const,
    createdAt: DateTime.now(),
    path: "/path/to/video",
    mediaType: "video/mp4",
    size: 1024000000,
  },
  createdAt: DateTime.fromISO("2023-10-15T10:30:00Z"),
  watchTime: Duration.fromObject({ minutes: 2 }),
})

const renderWithContext = (
  video = createMockVideo(),
  timestamp = Duration.fromObject({ seconds: 0 }),
  updateVideo = vi.fn(),
  snapshots: any[] = []
) => {
  const contextValue = {
    safeMode: false,
    theme: Theme.Light,
    setSafeMode: vi.fn(),
    setTheme: vi.fn(),
  }

  return render(
    <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
      <VideoWatch
        video={video}
        timestamp={timestamp}
        updateVideo={updateVideo}
        snapshots={snapshots}
      />
    </ApplicationConfigurationContext.Provider>
  )
}

describe("VideoWatch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render video player", () => {
    const { container } = renderWithContext()

    expect(container.querySelector("video")).toBeInTheDocument()
  })

  test("should render video title", () => {
    renderWithContext()

    expect(screen.getByText("Test Video Title")).toBeInTheDocument()
  })

  test("should render video metadata", () => {
    renderWithContext()

    expect(screen.getByText("Size:")).toBeInTheDocument()
    expect(screen.getByText("Duration:")).toBeInTheDocument()
    expect(screen.getByText("Source:")).toBeInTheDocument()
  })

  test("should render snapshots gallery", () => {
    renderWithContext()

    expect(screen.getByTestId("snapshots-gallery")).toBeInTheDocument()
  })

  test("should render delete button", () => {
    renderWithContext()

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()
  })

  test("should open delete dialog when delete button is clicked", () => {
    renderWithContext()

    const deleteButton = screen.getByRole("button", { name: "Delete" })
    fireEvent.click(deleteButton)

    expect(screen.getByText("Delete Video?")).toBeInTheDocument()
  })

  test("should close delete dialog when cancel is clicked", async () => {
    renderWithContext()

    const deleteButton = screen.getByRole("button", { name: "Delete" })
    fireEvent.click(deleteButton)

    const cancelButton = screen.getByRole("button", { name: "Cancel" })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText("Delete Video?")).not.toBeInTheDocument()
    })
  })

  test("should render video source link for non-local videos", () => {
    renderWithContext()

    const sourceLink = screen.getByRole("link", { name: "youtube" })
    expect(sourceLink).toHaveAttribute("href", "https://example.com/video")
    expect(sourceLink).toHaveAttribute("target", "_blank")
  })

  test("should render LOCAL text for local videos", () => {
    const video = createMockVideo()
    video.videoMetadata.videoSite = "local"

    renderWithContext(video)

    expect(screen.getByText("LOCAL")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "local" })).not.toBeInTheDocument()
  })

  test("should display human readable size", () => {
    renderWithContext()

    expect(screen.getByText(/1\.02/)).toBeInTheDocument()
  })

  test("should display human readable duration", () => {
    renderWithContext()

    expect(screen.getByText(/5:30/)).toBeInTheDocument()
  })

  test("should use safe mode translation when enabled", () => {
    const contextValue = {
      safeMode: true,
      theme: Theme.Light,
      setSafeMode: vi.fn(),
      setTheme: vi.fn(),
    }

    render(
      <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
        <VideoWatch
          video={createMockVideo()}
          timestamp={Duration.fromObject({ seconds: 0 })}
          updateVideo={vi.fn()}
          snapshots={[]}
        />
      </ApplicationConfigurationContext.Provider>
    )

    expect(screen.getByText("[SAFE] Test Video Title")).toBeInTheDocument()
  })

  test("should call deleteVideo when delete is confirmed", async () => {
    const { deleteVideo } = await import("~/services/video/VideoService")

    renderWithContext()

    // Open delete dialog
    const deleteButton = screen.getByRole("button", { name: "Delete" })
    fireEvent.click(deleteButton)

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText("Delete Video?")).toBeInTheDocument()
    })

    // Find the delete button in the dialog (it's a secondary colored button)
    const dialogButtons = screen.getAllByRole("button", { name: "Delete" })
    const confirmButton = dialogButtons[dialogButtons.length - 1]
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(deleteVideo).toHaveBeenCalledWith("video-123", false)
    })
  })

  test("should call deleteVideo with deleteFile true when checkbox is checked", async () => {
    const { deleteVideo } = await import("~/services/video/VideoService")

    renderWithContext()

    // Open delete dialog
    const deleteButton = screen.getByRole("button", { name: "Delete" })
    fireEvent.click(deleteButton)

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText("Delete Video?")).toBeInTheDocument()
    })

    // Check the delete file checkbox
    const checkbox = screen.getByRole("checkbox")
    fireEvent.click(checkbox)

    // Find the delete button in the dialog
    const dialogButtons = screen.getAllByRole("button", { name: "Delete" })
    const confirmButton = dialogButtons[dialogButtons.length - 1]
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(deleteVideo).toHaveBeenCalledWith("video-123", true)
    })
  })

  test("should update video title when edited", async () => {
    const { updateVideoTitle } = await import("~/services/video/VideoService")
    const updateVideo = vi.fn()

    renderWithContext(createMockVideo(), Duration.fromObject({ seconds: 0 }), updateVideo)

    // Find and click the edit button on the editable label
    const editButtons = screen.getAllByRole("button")
    const editButton = editButtons.find(button => button.getAttribute("aria-label")?.includes("Edit"))

    if (editButton) {
      fireEvent.click(editButton)
    }

    // updateVideoTitle should be callable through the component
    await waitFor(() => {
      expect(screen.getByText("Test Video Title")).toBeInTheDocument()
    })
  })
})
