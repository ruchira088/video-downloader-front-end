import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import VideoCard from "~/components/video/video-card/VideoCard"
import { DateTime, Duration } from "luxon"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import { FileResourceType } from "~/models/FileResource"
import React from "react"

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
}))

vi.mock("~/services/video/VideoService", () => ({
  fetchVideoSnapshotsByVideoId: vi.fn().mockResolvedValue([]),
}))

const createMockVideo = () => ({
  videoMetadata: {
    url: "https://example.com/video",
    id: "video-123",
    videoSite: "youtube",
    title: "Test Video Title That Is Long Enough",
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
  },
  fileResource: {
    id: "file-123",
    type: FileResourceType.Video as const,
    createdAt: DateTime.now(),
    path: "/path/to/video",
    mediaType: "video/mp4",
    size: 1024000000,
  },
  createdAt: DateTime.fromISO("2023-10-15T10:30:00Z"),
  watchTime: Duration.fromObject({ minutes: 2 }),
})

const renderWithContext = (video: ReturnType<typeof createMockVideo>) => {
  const contextValue = {
    safeMode: false,
    theme: Theme.Light,
    setSafeMode: vi.fn(),
    setTheme: vi.fn(),
  }

  return render(
    <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
      <VideoCard video={video} />
    </ApplicationConfigurationContext.Provider>
  )
}

describe("VideoCard", () => {
  test("should render video thumbnail", () => {
    renderWithContext(createMockVideo())

    expect(screen.getByAltText("video thumbnail")).toBeInTheDocument()
  })

  test("should render video title", () => {
    renderWithContext(createMockVideo())

    expect(screen.getByText(/Test Video Title/)).toBeInTheDocument()
  })

  test("should render video site card", () => {
    renderWithContext(createMockVideo())

    expect(screen.getByAltText("youtube logo")).toBeInTheDocument()
  })

  test("should render timestamp", () => {
    const video = createMockVideo()
    renderWithContext(video)

    // Timestamp component should be rendered
    expect(screen.getByText(/2023/)).toBeInTheDocument()
  })
})
