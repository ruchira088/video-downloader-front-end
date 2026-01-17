import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import Preview from "~/components/schedule/preview/Preview"
import { DateTime, Duration } from "luxon"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import { FileResourceType } from "~/models/FileResource"
import React from "react"

vi.mock("~/services/video/VideoService", () => ({
  metadata: vi.fn(),
}))

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
}))

import { metadata } from "~/services/video/VideoService"

const mockMetadata = vi.mocked(metadata)

const createMockVideoMetadata = () => ({
  url: "https://example.com/video",
  id: "video-123",
  videoSite: "youtube",
  title: "Test Video",
  duration: Duration.fromObject({ minutes: 5 }),
  size: 1024000,
  thumbnail: {
    id: "thumb-123",
    type: FileResourceType.Thumbnail as const,
    createdAt: DateTime.now(),
    path: "/path/to/thumb",
    mediaType: "image/jpeg",
    size: 1024,
  },
})

const renderWithContext = (url: string) => {
  const contextValue = {
    safeMode: false,
    theme: Theme.Light,
    setSafeMode: vi.fn(),
    setTheme: vi.fn(),
  }

  return render(
    <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
      <Preview url={url} />
    </ApplicationConfigurationContext.Provider>
  )
}

describe("Preview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test("should not render anything when URL is empty", () => {
    const { container } = renderWithContext("")
    expect(container.querySelector("div")?.children).toHaveLength(0)
  })

  test("should not render anything when URL is whitespace", () => {
    const { container } = renderWithContext("   ")
    expect(container.querySelector("div")?.children).toHaveLength(0)
  })

  test("should call metadata after debounce delay", async () => {
    mockMetadata.mockResolvedValue(createMockVideoMetadata())

    renderWithContext("https://example.com/video")

    expect(mockMetadata).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(mockMetadata).toHaveBeenCalledWith("https://example.com/video")
  })

  test("should show loading state while URL is provided", () => {
    mockMetadata.mockImplementation(() => new Promise(() => {}))

    renderWithContext("https://example.com/video")

    // Should show loading component
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })
})
