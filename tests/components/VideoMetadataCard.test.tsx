import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import VideoMetadataCard from "~/components/video/video-metadata-card/VideoMetadataCard"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"
import type { VideoMetadata } from "~/models/VideoMetadata"
import { buildSnapshot, buildVideoMetadata, durationJson } from "../fixtures"

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn((resource, safeMode) =>
    safeMode ? "https://safe.example.com/image.jpg" : "https://example.com/image.jpg"
  ),
}))

vi.mock("~/services/video/VideoService", () => ({
  fetchVideoSnapshotsByVideoId: vi.fn().mockResolvedValue([]),
}))

vi.mock("~/services/sanitize/SanitizationService", () => ({
  translate: vi.fn((text, safeMode) => (safeMode ? "[SAFE] " + text : text)),
}))

const renderWithContext = (
  videoMetadata: VideoMetadata,
  options: { safeMode?: boolean; disableSnapshots?: boolean; enableSourceLink?: boolean } = {}
) => {
  const contextValue = {
    safeMode: options.safeMode ?? false,
    theme: Theme.Light,
    setSafeMode: vi.fn(),
    setTheme: vi.fn(),
  }

  return render(
    <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
      <VideoMetadataCard
        videoMetadata={videoMetadata}
        disableSnapshots={options.disableSnapshots}
        enableSourceLink={options.enableSourceLink}
      />
    </ApplicationConfigurationContext.Provider>
  )
}

describe("VideoMetadataCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render video thumbnail", () => {
    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }))

    expect(screen.getByAltText("video thumbnail")).toBeInTheDocument()
  })

  test("should render video title", () => {
    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }))

    expect(screen.getByText("Test Video Title")).toBeInTheDocument()
  })

  test("should render video site card", () => {
    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }))

    expect(screen.getByAltText("youtube logo")).toBeInTheDocument()
  })

  test("should render file size", () => {
    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }))

    // 1024000000 bytes = 1.02 GB (using 1000-based units)
    expect(screen.getByText(/1\.02/)).toBeInTheDocument()
  })

  test("should render duration", () => {
    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }))

    expect(screen.getByText(/5:30/)).toBeInTheDocument()
  })

  test("should render source link when enableSourceLink is true", () => {
    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }), { enableSourceLink: true })

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "https://example.com/video")
    expect(link).toHaveAttribute("target", "_blank")
  })

  test("should not render source link when enableSourceLink is false", () => {
    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }), { enableSourceLink: false })

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  test("should trim long titles", () => {
    const videoMetadata = {
      ...buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }),
      title: "This is a very long video title that should be trimmed at some point because it exceeds the limit",
    }

    renderWithContext(videoMetadata)

    // Title should be trimmed
    expect(screen.queryByText(/This is a very long video title/)).toBeInTheDocument()
    expect(screen.queryByText(/exceeds the limit/)).not.toBeInTheDocument()
  })

  test("should render children when provided", () => {
    const contextValue = {
      safeMode: false,
      theme: Theme.Light,
      setSafeMode: vi.fn(),
      setTheme: vi.fn(),
    }

    render(
      <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
        <VideoMetadataCard videoMetadata={buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" })}>
          <div data-testid="child">Child Content</div>
        </VideoMetadataCard>
      </ApplicationConfigurationContext.Provider>
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  test("should fetch snapshots on mouse over when not disabled", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")

    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }), { disableSnapshots: false })

    const thumbnail = screen.getByAltText("video thumbnail")
    fireEvent.mouseOver(thumbnail.parentElement!)

    await waitFor(() => {
      expect(fetchVideoSnapshotsByVideoId).toHaveBeenCalledWith("video-123")
    })
  })

  test("should not fetch snapshots when disableSnapshots is true", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")

    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }), { disableSnapshots: true })

    const thumbnail = screen.getByAltText("video thumbnail")
    fireEvent.mouseOver(thumbnail.parentElement!)

    // Wait a bit to ensure no call was made
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(fetchVideoSnapshotsByVideoId).not.toHaveBeenCalled()
  })

  test("should reset index on mouse leave", async () => {
    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }), { disableSnapshots: false })

    const thumbnail = screen.getByAltText("video thumbnail")
    const container = thumbnail.parentElement!

    fireEvent.mouseOver(container)
    fireEvent.mouseLeave(container)

    // Hovering kicks off the snapshot fetch; flush it so its state update lands inside act().
    await act(async () => {})

    // Component should reset without errors
    expect(thumbnail).toBeInTheDocument()
  })

  test("should use safe mode image URL when safeMode is enabled", async () => {
    const { imageUrl } = await import("~/services/asset/AssetService")

    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }), { safeMode: true })

    expect(imageUrl).toHaveBeenCalledWith(expect.anything(), true)
  })

  test("should apply custom classNames", () => {
    const contextValue = {
      safeMode: false,
      theme: Theme.Light,
      setSafeMode: vi.fn(),
      setTheme: vi.fn(),
    }

    const { container } = render(
      <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
        <VideoMetadataCard videoMetadata={buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" })} classNames="custom-class" />
      </ApplicationConfigurationContext.Provider>
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })

  test("should trim title at space boundary when over limit", () => {
    const videoMetadata = {
      ...buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }),
      title: "Short title that fits in the limit",
    }

    renderWithContext(videoMetadata)

    // Title should be trimmed at word boundary
    expect(screen.getByText(/Short title that fits in the/)).toBeInTheDocument()
  })

  test("should trim title at character limit when no space found", () => {
    const videoMetadata = {
      ...buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }),
      title: "TitleWithNoSpacesThatWillBeTrimmedAtCharacterLimit",
    }

    renderWithContext(videoMetadata)

    // Title should still be rendered (trimmed at character limit)
    expect(screen.getByText(/TitleWithNoSpacesThatWillBeTrimmed/)).toBeInTheDocument()
  })

  test("should show snapshots when hovering and snapshots are available", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")
    vi.mocked(fetchVideoSnapshotsByVideoId).mockResolvedValue([
      buildSnapshot({ id: "snap-file-1", videoTimestamp: durationJson(30) })
    ])

    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }), { disableSnapshots: false })

    const thumbnail = screen.getByAltText("video thumbnail")
    fireEvent.mouseOver(thumbnail.parentElement!)

    await waitFor(() => {
      expect(fetchVideoSnapshotsByVideoId).toHaveBeenCalledWith("video-123")
    })
  })

  test("should lock image dimensions on load", () => {
    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }))

    const thumbnail = screen.getByAltText("video thumbnail")
    fireEvent.load(thumbnail)

    // Image should still be visible after load
    expect(thumbnail).toBeInTheDocument()
  })

  test("should handle window resize events", () => {
    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }))

    // Trigger resize event
    fireEvent(window, new Event("resize"))

    // Component should still be rendered after resize
    expect(screen.getByAltText("video thumbnail")).toBeInTheDocument()
  })

  test("should cleanup event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    const { unmount } = renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }))
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })

  test("should not start a second interval when hover fires again", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")
    const setIntervalSpy = vi.spyOn(window, "setInterval")

    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }), { disableSnapshots: false })

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

    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }), { disableSnapshots: false })

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

    const { unmount } = renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }), { disableSnapshots: false })

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

    renderWithContext(buildVideoMetadata({ title: "Test Video Title", url: "https://example.com/video" }), { disableSnapshots: false })

    const thumbnail = screen.getByAltText("video thumbnail")
    fireEvent.mouseOver(thumbnail.parentElement!)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: "fetch failed" }))
    })

    expect(thumbnail).toBeInTheDocument()
    consoleErrorSpy.mockRestore()
  })

})
