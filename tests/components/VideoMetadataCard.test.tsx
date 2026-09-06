import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import VideoMetadataCard from "~/components/video/video-metadata-card/VideoMetadataCard"
import React from "react"
import type { VideoMetadata } from "~/models/VideoMetadata"
import { buildSnapshot, buildVideoMetadata, durationJson } from "../fixtures"
import { withApplicationConfiguration } from "../helpers"

// Keyed by resource id so a test can tell the thumbnail apart from a snapshot.
vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn((resource, safeMode) =>
    safeMode ? "https://safe.example.com/image.jpg" : `https://example.com/${resource.id}.jpg`
  ),
}))

vi.mock("~/services/video/VideoService", () => ({
  fetchVideoSnapshotsByVideoId: vi.fn().mockResolvedValue([]),
}))

vi.mock("~/services/sanitize/SanitizationService", () => ({
  translate: vi.fn((text, safeMode) => (safeMode ? "[SAFE] " + text : text)),
}))

const videoMetadata = () => buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" })

const renderWithContext = (
  metadata: VideoMetadata = videoMetadata(),
  options: { safeMode?: boolean; disableSnapshots?: boolean; enableSourceLink?: boolean } = {}
) =>
  render(
    withApplicationConfiguration(
      <VideoMetadataCard
        videoMetadata={metadata}
        disableSnapshots={options.disableSnapshots}
        enableSourceLink={options.enableSourceLink}
      />,
      { safeMode: options.safeMode ?? false }
    )
  )

const hoverThumbnail = () => {
  const thumbnail = screen.getByAltText("video thumbnail")
  fireEvent.mouseOver(thumbnail.parentElement!)
  return thumbnail
}

describe("VideoMetadataCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render video thumbnail", () => {
    renderWithContext()

    expect(screen.getByAltText("video thumbnail")).toHaveAttribute("src", "https://example.com/thumb-video-123.jpg")
  })

  test("should render video title", () => {
    renderWithContext()

    expect(screen.getByText("Test Video Title")).toBeInTheDocument()
  })

  test("should render video site card", () => {
    renderWithContext()

    expect(screen.getByAltText("youtube logo")).toBeInTheDocument()
  })

  test("should render file size", () => {
    renderWithContext()

    // 1024000000 bytes = 1.02 GB (using 1000-based units)
    expect(screen.getByText(/1\.02/)).toBeInTheDocument()
  })

  test("should render duration", () => {
    renderWithContext()

    expect(screen.getByText(/5:30/)).toBeInTheDocument()
  })

  test("should render source link when enableSourceLink is true", () => {
    renderWithContext(videoMetadata(), { enableSourceLink: true })

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "https://example.com/video")
    expect(link).toHaveAttribute("target", "_blank")
  })

  test("should not render source link when enableSourceLink is false", () => {
    renderWithContext(videoMetadata(), { enableSourceLink: false })

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  test("should trim long titles at the first space after the limit", () => {
    renderWithContext(
      buildVideoMetadata({ title: "This is a very long video title that should be trimmed at some point because it exceeds the limit" })
    )

    expect(screen.getByText("This is a very long video title that")).toBeInTheDocument()
  })

  test("should trim titles at the limit when they have no later space", () => {
    renderWithContext(buildVideoMetadata({ title: "TitleWithNoSpacesThatWillBeTrimmedAtCharacterLimit" }))

    expect(screen.getByText("TitleWithNoSpacesThatWillBeTrimmedA")).toBeInTheDocument()
  })

  test("should render children when provided", () => {
    render(
      withApplicationConfiguration(
        <VideoMetadataCard videoMetadata={videoMetadata()}>
          <div data-testid="child">Child Content</div>
        </VideoMetadataCard>
      )
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  test("should fetch snapshots on mouse over when not disabled", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")

    renderWithContext(videoMetadata(), { disableSnapshots: false })

    hoverThumbnail()

    await waitFor(() => {
      expect(fetchVideoSnapshotsByVideoId).toHaveBeenCalledWith("video-123")
    })
  })

  test("should not fetch snapshots when disableSnapshots is true", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")

    renderWithContext(videoMetadata(), { disableSnapshots: true })

    hoverThumbnail()

    // Wait a bit to ensure no call was made
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(fetchVideoSnapshotsByVideoId).not.toHaveBeenCalled()
  })

  test("should show snapshots while hovering and the thumbnail again on leave", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")
    vi.mocked(fetchVideoSnapshotsByVideoId).mockResolvedValue([
      buildSnapshot({ id: "snap-file-1", videoTimestamp: durationJson(30) })
    ])

    renderWithContext(videoMetadata(), { disableSnapshots: false })

    const thumbnail = hoverThumbnail()

    await waitFor(() => {
      expect(thumbnail).toHaveAttribute("src", "https://example.com/snap-file-1.jpg")
    })

    fireEvent.mouseLeave(thumbnail.parentElement!)

    expect(thumbnail).toHaveAttribute("src", "https://example.com/thumb-video-123.jpg")
  })

  test("should reset index on mouse leave", async () => {
    renderWithContext(videoMetadata(), { disableSnapshots: false })

    const thumbnail = hoverThumbnail()
    fireEvent.mouseLeave(thumbnail.parentElement!)

    // Hovering kicks off the snapshot fetch; flush it so its state update lands inside act().
    await act(async () => {})

    expect(thumbnail).toBeInTheDocument()
  })

  test("should use safe mode image URL when safeMode is enabled", async () => {
    renderWithContext(videoMetadata(), { safeMode: true })

    expect(screen.getByAltText("video thumbnail")).toHaveAttribute("src", "https://safe.example.com/image.jpg")
    expect(screen.getByText("[SAFE] Test Video Title")).toBeInTheDocument()
  })

  test("should apply custom classNames", () => {
    const { container } = render(
      withApplicationConfiguration(<VideoMetadataCard videoMetadata={videoMetadata()} classNames="custom-class" />)
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })

  test("should lock image dimensions on load", () => {
    renderWithContext()

    const thumbnail = screen.getByAltText("video thumbnail")
    fireEvent.load(thumbnail)

    // Image should still be visible after load
    expect(thumbnail).toBeInTheDocument()
  })

  test("should handle window resize events", () => {
    renderWithContext()

    // Trigger resize event
    fireEvent(window, new Event("resize"))

    // Component should still be rendered after resize
    expect(screen.getByAltText("video thumbnail")).toBeInTheDocument()
  })

  test("should cleanup event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    const { unmount } = renderWithContext()
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })

  test("should not start a second interval when hover fires again", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")
    const setIntervalSpy = vi.spyOn(window, "setInterval")

    renderWithContext(videoMetadata(), { disableSnapshots: false })

    const container = screen.getByAltText("video thumbnail").parentElement!
    fireEvent.mouseOver(container)
    fireEvent.mouseOver(container)

    await waitFor(() => {
      expect(fetchVideoSnapshotsByVideoId).toHaveBeenCalledTimes(1)
    })

    const snapshotIntervalCalls = setIntervalSpy.mock.calls.filter(([, delay]) => delay === 400)
    expect(snapshotIntervalCalls).toHaveLength(1)
    setIntervalSpy.mockRestore()
  })

  test("should clear the interval on mouse leave", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")
    const setIntervalSpy = vi.spyOn(window, "setInterval")
    const clearIntervalSpy = vi.spyOn(window, "clearInterval")

    renderWithContext(videoMetadata(), { disableSnapshots: false })

    const container = screen.getByAltText("video thumbnail").parentElement!
    fireEvent.mouseOver(container)
    const intervalId = setIntervalSpy.mock.results[0].value

    await waitFor(() => {
      expect(fetchVideoSnapshotsByVideoId).toHaveBeenCalled()
    })

    fireEvent.mouseLeave(container)

    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId)
    setIntervalSpy.mockRestore()
    clearIntervalSpy.mockRestore()
  })

  test("should clear the interval on unmount", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")
    const setIntervalSpy = vi.spyOn(window, "setInterval")
    const clearIntervalSpy = vi.spyOn(window, "clearInterval")

    const { unmount } = renderWithContext(videoMetadata(), { disableSnapshots: false })

    const container = screen.getByAltText("video thumbnail").parentElement!
    fireEvent.mouseOver(container)
    const intervalId = setIntervalSpy.mock.results[0].value

    await waitFor(() => {
      expect(fetchVideoSnapshotsByVideoId).toHaveBeenCalled()
    })

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId)
    setIntervalSpy.mockRestore()
    clearIntervalSpy.mockRestore()
  })

  test("should log an error when fetching snapshots fails", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")
    vi.mocked(fetchVideoSnapshotsByVideoId).mockRejectedValueOnce(new Error("fetch failed"))
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    renderWithContext(videoMetadata(), { disableSnapshots: false })

    const thumbnail = hoverThumbnail()

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: "fetch failed" }))
    })

    expect(thumbnail).toBeInTheDocument()
    consoleErrorSpy.mockRestore()
  })
})
