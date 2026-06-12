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

const previewWithContext = (url: string) => {
  const contextValue = {
    safeMode: false,
    theme: Theme.Light,
    setSafeMode: vi.fn(),
    setTheme: vi.fn(),
  }

  return (
    <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
      <Preview url={url} />
    </ApplicationConfigurationContext.Provider>
  )
}

const renderWithContext = (url: string) => render(previewWithContext(url))

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

  test("should not overwrite the newer preview with a slow stale response", async () => {
    let resolveStale: (value: ReturnType<typeof createMockVideoMetadata>) => void = () => {}
    const staleMetadata = { ...createMockVideoMetadata(), title: "Old Video" }
    const freshMetadata = { ...createMockVideoMetadata(), title: "New Video" }

    mockMetadata
      .mockImplementationOnce(() => new Promise((resolve) => { resolveStale = resolve }))
      .mockResolvedValueOnce(freshMetadata)

    const { rerender } = renderWithContext("https://example.com/old")

    // Fire the request for the old URL; its response stays pending
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    rerender(previewWithContext("https://example.com/new"))

    // Fire the request for the new URL; its response resolves immediately
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(screen.getByText("New Video")).toBeInTheDocument()

    // The stale response arrives late and must not overwrite the newer preview
    await act(async () => {
      resolveStale(staleMetadata)
    })

    expect(screen.getByText("New Video")).toBeInTheDocument()
    expect(screen.queryByText("Old Video")).not.toBeInTheDocument()
  })

  test("should show an error state instead of the spinner when metadata fails", async () => {
    mockMetadata.mockRejectedValue(new Error("metadata failed"))

    renderWithContext("https://example.com/video")

    expect(screen.getByRole("progressbar")).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    expect(screen.getByText("Unable to load video preview")).toBeInTheDocument()
  })
})
