import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import VideoWatch from "~/pages/authenticated/videos/video-page/watch/VideoWatch"
import { Duration } from "luxon"
import React from "react"
import { buildVideo, type Json } from "../fixtures"
import { withApplicationConfiguration } from "../helpers"
import { playbackPositionService } from "~/services/playback/PlaybackPositionService"

const createMockVideo = (overrides: Json = {}) =>
  buildVideo({
    title: "Test Video Title",
    createdAt: "2023-10-15T10:30:00+00:00",
    videoMetadata: { url: "https://example.com/video" },
    ...overrides
  })

const mockNavigate = vi.fn()

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
  videoUrl: vi.fn(() => "https://example.com/video.mp4"),
}))

vi.mock("~/services/video/VideoService", () => ({
  updateVideoTitle: vi.fn(),
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

const renderWithContext = (
  video = createMockVideo(),
  timestamp = Duration.fromObject({ seconds: 0 }),
  updateVideo = vi.fn(),
  safeMode = false
) =>
  render(
    withApplicationConfiguration(
      <VideoWatch video={video} timestamp={timestamp} updateVideo={updateVideo} snapshots={[]} />,
      { safeMode }
    )
  )

describe("VideoWatch", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()

    // Set here rather than in the vi.mock factory so the resolved value is a real parsed
    // Video rather than a hand-rolled stand-in.
    const { updateVideoTitle } = await import("~/services/video/VideoService")
    vi.mocked(updateVideoTitle).mockResolvedValue(createMockVideo({ title: "Updated Title" }))
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

  test("should disable the dialog buttons while the delete is in flight", async () => {
    const { deleteVideo } = await import("~/services/video/VideoService")
    let resolveDelete: () => void = () => {}
    vi.mocked(deleteVideo).mockReturnValue(new Promise((resolve) => { resolveDelete = () => resolve(createMockVideo()) }))
    renderWithContext()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Deleting..." }))
    expect(deleteVideo).toHaveBeenCalledTimes(1)

    resolveDelete()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/")
    })
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
    renderWithContext(createMockVideo(), Duration.fromObject({ seconds: 0 }), vi.fn(), true)

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

  test("should toggle the delete file checkbox visually", async () => {
    renderWithContext()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(screen.getByText("Delete Video?")).toBeInTheDocument()
    })

    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  test("should navigate to the videos listing after a successful delete", async () => {
    renderWithContext()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(screen.getByText("Delete Video?")).toBeInTheDocument()
    })

    const dialogButtons = screen.getAllByRole("button", { name: "Delete" })
    fireEvent.click(dialogButtons[dialogButtons.length - 1])

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/")
    })
  })

  test("should not navigate and keep the dialog open when delete fails", async () => {
    const { deleteVideo } = await import("~/services/video/VideoService")
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.mocked(deleteVideo).mockRejectedValueOnce(new Error("delete failed"))

    renderWithContext()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(screen.getByText("Delete Video?")).toBeInTheDocument()
    })

    const dialogButtons = screen.getAllByRole("button", { name: "Delete" })
    fireEvent.click(dialogButtons[dialogButtons.length - 1])

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.getByText("Delete Video?")).toBeInTheDocument()

    consoleWarnSpy.mockRestore()
  })

  test("should update video title when edited", async () => {
    const updateVideo = vi.fn()

    renderWithContext(createMockVideo(), Duration.fromObject({ seconds: 0 }), updateVideo)

    // Find and click the edit button on the editable label
    fireEvent.click(screen.getByRole("button", { name: "Edit" }))

    // The current title is loaded into the editor
    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("Test Video Title")
    })
  })

  test("should not allow editing the title in safe mode, where the shown title is a substitute", () => {
    renderWithContext(createMockVideo(), Duration.fromObject({ seconds: 0 }), vi.fn(), true)

    expect(screen.getByText("[SAFE] Test Video Title")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument()
  })

  test("should call updateVideoTitle and updateVideo when title is edited via EditableLabel", async () => {
    const { updateVideoTitle } = await import("~/services/video/VideoService")
    const updateVideo = vi.fn()

    renderWithContext(
      createMockVideo(),
      Duration.fromObject({ seconds: 0 }),
      updateVideo
    )

    // Hover over the title to reveal the Edit button
    const titleElement = screen.getByText("Test Video Title")
    const textContainer = titleElement.closest("div")!
    fireEvent.mouseEnter(textContainer)

    // Click the Edit button
    const editButton = await screen.findByRole("button", { name: /edit/i })
    fireEvent.click(editButton)

    // Find the text field and change the value
    const textField = screen.getByRole("textbox")
    fireEvent.change(textField, { target: { value: "New Video Title" } })

    // Click Save button
    const saveButton = screen.getByRole("button", { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(updateVideoTitle).toHaveBeenCalledWith("video-123", "New Video Title")
    })

    await waitFor(() => {
      expect(updateVideo).toHaveBeenCalled()
    })
  })

  test("should display resolution when video metadata is loaded", async () => {
    const { container } = renderWithContext()

    const videoElement = container.querySelector("video") as HTMLVideoElement

    // Mock videoWidth and videoHeight properties
    Object.defineProperty(videoElement, "videoWidth", { value: 1920, writable: true })
    Object.defineProperty(videoElement, "videoHeight", { value: 1080, writable: true })

    // Trigger the loadedmetadata event
    fireEvent.loadedMetadata(videoElement)

    await waitFor(() => {
      expect(screen.getByText("1920x1080")).toBeInTheDocument()
    })
  })

  test("should show loading spinner when resolution is not yet available", () => {
    const { container } = renderWithContext()

    // Before loadedmetadata event, resolution should show a loading spinner
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
  })

  test("should update resolution state when handleLoadedMetadata is triggered", async () => {
    const { container } = renderWithContext()

    const videoElement = container.querySelector("video") as HTMLVideoElement

    // Set up mock video dimensions
    Object.defineProperty(videoElement, "videoWidth", { value: 3840, writable: true })
    Object.defineProperty(videoElement, "videoHeight", { value: 2160, writable: true })

    // Trigger the loadedmetadata event
    fireEvent.loadedMetadata(videoElement)

    // After the event, resolution should be displayed
    await waitFor(() => {
      expect(screen.getByText("3840x2160")).toBeInTheDocument()
    })

    // Loading spinner should no longer be present
    expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument()
  })

  test("should handle video player ref being null in handleLoadedMetadata", async () => {
    const { container } = renderWithContext()

    const videoElement = container.querySelector("video") as HTMLVideoElement

    // Trigger the loadedmetadata event without setting videoWidth/videoHeight
    // This tests that the Option.fromNullable handles the ref correctly
    fireEvent.loadedMetadata(videoElement)

    // Should not throw and should still have loading spinner (since videoWidth/videoHeight are 0)
    await waitFor(() => {
      expect(screen.getByText("0x0")).toBeInTheDocument()
    })
  })

  describe("resuming playback", () => {
    // jsdom's media elements have no real playback; give the player a position to report.
    const setPlayback = (videoElement: HTMLVideoElement, currentTime: number, duration = 330) => {
      Object.defineProperty(videoElement, "currentTime", { configurable: true, writable: true, value: currentTime })
      Object.defineProperty(videoElement, "duration", { configurable: true, writable: true, value: duration })
    }

    const savedSeconds = (videoId: string) =>
      playbackPositionService.savedPosition(videoId).map(position => position.as("seconds")).toNullable()

    test("should offer to resume from where the viewer stopped", () => {
      const video = createMockVideo()
      playbackPositionService.savePosition(video.videoMetadata.id, Duration.fromObject({ seconds: 154 }), Duration.fromObject({ seconds: 330 }))

      const { container } = renderWithContext(video)
      fireEvent.click(screen.getByRole("button", { name: "Resume" }))

      expect(screen.queryByText("You stopped at 2:34")).not.toBeInTheDocument()
      expect((container.querySelector("video") as HTMLVideoElement).currentTime).toBe(154)
    })

    test("should show the saved position and let the viewer dismiss it", () => {
      const video = createMockVideo()
      playbackPositionService.savePosition(video.videoMetadata.id, Duration.fromObject({ seconds: 154 }), Duration.fromObject({ seconds: 330 }))

      renderWithContext(video)
      expect(screen.getByText("You stopped at 2:34")).toBeInTheDocument()

      fireEvent.click(screen.getByRole("button", { name: "Dismiss" }))
      expect(screen.queryByText("You stopped at 2:34")).not.toBeInTheDocument()
    })

    test("should not offer to resume when the link gives a timestamp", () => {
      const video = createMockVideo()
      playbackPositionService.savePosition(video.videoMetadata.id, Duration.fromObject({ seconds: 154 }), Duration.fromObject({ seconds: 330 }))

      renderWithContext(video, Duration.fromObject({ seconds: 60 }))

      expect(screen.queryByRole("button", { name: "Resume" })).not.toBeInTheDocument()
    })

    test("should not offer to resume a video with no saved position", () => {
      renderWithContext()

      expect(screen.queryByRole("button", { name: "Resume" })).not.toBeInTheDocument()
    })

    test("should save the position every few seconds of playback, not on every update", () => {
      const video = createMockVideo()
      const { container } = renderWithContext(video)
      const videoElement = container.querySelector("video") as HTMLVideoElement

      setPlayback(videoElement, 3)
      fireEvent.timeUpdate(videoElement)
      expect(savedSeconds(video.videoMetadata.id)).toBeNull()

      setPlayback(videoElement, 42)
      fireEvent.timeUpdate(videoElement)
      expect(savedSeconds(video.videoMetadata.id)).toBe(42)

      setPlayback(videoElement, 44)
      fireEvent.timeUpdate(videoElement)
      expect(savedSeconds(video.videoMetadata.id)).toBe(42)
    })

    test("should save the position on pause, using the video's metadata duration until the player knows it", () => {
      const video = createMockVideo()
      const { container } = renderWithContext(video)
      const videoElement = container.querySelector("video") as HTMLVideoElement

      setPlayback(videoElement, 100, Number.NaN)
      fireEvent.pause(videoElement)

      expect(savedSeconds(video.videoMetadata.id)).toBe(100)
    })

    test("should forget the position once the video ends", () => {
      const video = createMockVideo()
      playbackPositionService.savePosition(video.videoMetadata.id, Duration.fromObject({ seconds: 154 }), Duration.fromObject({ seconds: 330 }))
      const { container } = renderWithContext(video)

      fireEvent.ended(container.querySelector("video") as HTMLVideoElement)

      expect(savedSeconds(video.videoMetadata.id)).toBeNull()
      expect(screen.queryByRole("button", { name: "Resume" })).not.toBeInTheDocument()
    })
  })

  test("should list the keyboard shortcuts", async () => {
    renderWithContext()

    fireEvent.mouseOver(screen.getByRole("button", { name: "Keyboard shortcuts" }))

    expect(await screen.findByText("Play or pause")).toBeInTheDocument()
  })
})
