import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import Preview from "~/components/schedule/preview/Preview"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"
import type { VideoMetadata } from "~/models/VideoMetadata"
import { buildVideoMetadata } from "../fixtures"

vi.mock("~/services/video/VideoService", () => ({
  metadata: vi.fn(),
}))

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
}))

import { metadata } from "~/services/video/VideoService"

const mockMetadata = vi.mocked(metadata)

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
    mockMetadata.mockResolvedValue(buildVideoMetadata())

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
    let resolveStale: (value: VideoMetadata) => void = () => {}
    const staleMetadata = buildVideoMetadata({ title: "Old Video" })
    const freshMetadata = buildVideoMetadata({ title: "New Video" })

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
