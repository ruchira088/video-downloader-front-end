import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import VideoCard from "~/components/video/video-card/VideoCard"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"
import type { Video } from "~/models/Video"
import { buildVideo } from "../fixtures"

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
}))

vi.mock("~/services/video/VideoService", () => ({
  fetchVideoSnapshotsByVideoId: vi.fn().mockResolvedValue([]),
}))

// Pinned so the rendered year is stable, and long enough to exercise title truncation.
const VIDEO = {
  title: "Test Video Title That Is Long Enough",
  createdAt: "2023-10-15T10:30:00+00:00"
}

const renderWithContext = (video: Video) => {
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
    renderWithContext(buildVideo(VIDEO))

    expect(screen.getByAltText("video thumbnail")).toBeInTheDocument()
  })

  test("should render video title", () => {
    renderWithContext(buildVideo(VIDEO))

    expect(screen.getByText(/Test Video Title/)).toBeInTheDocument()
  })

  test("should render video site card", () => {
    renderWithContext(buildVideo(VIDEO))

    expect(screen.getByAltText("youtube logo")).toBeInTheDocument()
  })

  test("should render timestamp", () => {
    const video = buildVideo(VIDEO)
    renderWithContext(video)

    // Timestamp component should be rendered
    expect(screen.getByText(/2023/)).toBeInTheDocument()
  })
})
