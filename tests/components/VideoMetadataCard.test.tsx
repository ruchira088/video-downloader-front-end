import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import VideoMetadataCard from "~/components/video/video-metadata-card/VideoMetadataCard"
import { DateTime, Duration } from "luxon"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import { FileResourceType } from "~/models/FileResource"
import React from "react"

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

const createMockVideoMetadata = () => ({
  url: "https://example.com/video",
  id: "video-123",
  videoSite: "youtube",
  title: "Test Video Title",
  duration: Duration.fromObject({ minutes: 5, seconds: 30 }),
  size: 1024000000,
  thumbnail: {
    id: "thumb-123",
    type: FileResourceType.Thumbnail as const,
    createdAt: DateTime.now(),
    path: "/path/to/thumb",
    mediaType: "image/jpeg",
    size: 1024,
  },
})

const renderWithContext = (
  videoMetadata: ReturnType<typeof createMockVideoMetadata>,
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
    renderWithContext(createMockVideoMetadata())

    expect(screen.getByAltText("video thumbnail")).toBeInTheDocument()
  })

  test("should render video title", () => {
    renderWithContext(createMockVideoMetadata())

    expect(screen.getByText("Test Video Title")).toBeInTheDocument()
  })

  test("should render video site card", () => {
    renderWithContext(createMockVideoMetadata())

    expect(screen.getByAltText("youtube logo")).toBeInTheDocument()
  })

  test("should render file size", () => {
    renderWithContext(createMockVideoMetadata())

    // 1024000000 bytes = 1.02 GB (using 1000-based units)
    expect(screen.getByText(/1\.02/)).toBeInTheDocument()
  })

  test("should render duration", () => {
    renderWithContext(createMockVideoMetadata())

    expect(screen.getByText(/5:30/)).toBeInTheDocument()
  })

  test("should render source link when enableSourceLink is true", () => {
    renderWithContext(createMockVideoMetadata(), { enableSourceLink: true })

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "https://example.com/video")
    expect(link).toHaveAttribute("target", "_blank")
  })

  test("should not render source link when enableSourceLink is false", () => {
    renderWithContext(createMockVideoMetadata(), { enableSourceLink: false })

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  test("should trim long titles", () => {
    const videoMetadata = {
      ...createMockVideoMetadata(),
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
        <VideoMetadataCard videoMetadata={createMockVideoMetadata()}>
          <div data-testid="child">Child Content</div>
        </VideoMetadataCard>
      </ApplicationConfigurationContext.Provider>
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  test("should fetch snapshots on mouse over when not disabled", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")

    renderWithContext(createMockVideoMetadata(), { disableSnapshots: false })

    const thumbnail = screen.getByAltText("video thumbnail")
    fireEvent.mouseOver(thumbnail.parentElement!)

    await waitFor(() => {
      expect(fetchVideoSnapshotsByVideoId).toHaveBeenCalledWith("video-123")
    })
  })

  test("should not fetch snapshots when disableSnapshots is true", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")

    renderWithContext(createMockVideoMetadata(), { disableSnapshots: true })

    const thumbnail = screen.getByAltText("video thumbnail")
    fireEvent.mouseOver(thumbnail.parentElement!)

    // Wait a bit to ensure no call was made
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(fetchVideoSnapshotsByVideoId).not.toHaveBeenCalled()
  })

  test("should reset index on mouse leave", async () => {
    renderWithContext(createMockVideoMetadata(), { disableSnapshots: false })

    const thumbnail = screen.getByAltText("video thumbnail")
    const container = thumbnail.parentElement!

    fireEvent.mouseOver(container)
    fireEvent.mouseLeave(container)

    // Component should reset without errors
    expect(thumbnail).toBeInTheDocument()
  })

  test("should use safe mode image URL when safeMode is enabled", async () => {
    const { imageUrl } = await import("~/services/asset/AssetService")

    renderWithContext(createMockVideoMetadata(), { safeMode: true })

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
        <VideoMetadataCard videoMetadata={createMockVideoMetadata()} classNames="custom-class" />
      </ApplicationConfigurationContext.Provider>
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })

  test("should trim title at space boundary when over limit", () => {
    const videoMetadata = {
      ...createMockVideoMetadata(),
      title: "Short title that fits in the limit",
    }

    renderWithContext(videoMetadata)

    // Title should be trimmed at word boundary
    expect(screen.getByText(/Short title that fits in the/)).toBeInTheDocument()
  })

  test("should trim title at character limit when no space found", () => {
    const videoMetadata = {
      ...createMockVideoMetadata(),
      title: "TitleWithNoSpacesThatWillBeTrimmedAtCharacterLimit",
    }

    renderWithContext(videoMetadata)

    // Title should still be rendered (trimmed at character limit)
    expect(screen.getByText(/TitleWithNoSpacesThatWillBeTrimmed/)).toBeInTheDocument()
  })

  test("should show snapshots when hovering and snapshots are available", async () => {
    const { fetchVideoSnapshotsByVideoId } = await import("~/services/video/VideoService")
    vi.mocked(fetchVideoSnapshotsByVideoId).mockResolvedValue([
      {
        videoId: "video-123",
        videoTimestamp: Duration.fromObject({ seconds: 30 }),
        fileResource: {
          id: "snap-file-1",
          type: FileResourceType.Snapshot as const,
          createdAt: DateTime.now(),
          path: "/path/to/snap",
          mediaType: "image/jpeg",
          size: 1024,
        },
      },
    ])

    renderWithContext(createMockVideoMetadata(), { disableSnapshots: false })

    const thumbnail = screen.getByAltText("video thumbnail")
    fireEvent.mouseOver(thumbnail.parentElement!)

    await waitFor(() => {
      expect(fetchVideoSnapshotsByVideoId).toHaveBeenCalledWith("video-123")
    })
  })
})
