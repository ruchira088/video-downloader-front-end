import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import VideoSnapshotsGallery from "~/components/video/video-snapshots/VideoSnapshotsGallery"
import { createMemoryRouter, RouterProvider } from "react-router"
import { DateTime, Duration } from "luxon"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn((resource, safeMode) =>
    safeMode ? "https://safe.example.com/image.jpg" : `https://example.com/${resource.id}.jpg`
  ),
}))

const createMockSnapshot = (id: string, seconds: number) => ({
  id,
  videoId: "video-123",
  videoTimestamp: Duration.fromObject({ seconds }),
  fileResource: {
    id: `file-${id}`,
    type: "snapshot" as const,
    createdAt: DateTime.now(),
    path: `/path/to/${id}`,
    mediaType: "image/jpeg",
    size: 1024,
  },
})

const renderWithRouter = (snapshots: ReturnType<typeof createMockSnapshot>[]) => {
  const contextValue = {
    safeMode: false,
    theme: Theme.Light,
    setSafeMode: vi.fn(),
    setTheme: vi.fn(),
  }

  const router = createMemoryRouter([
    {
      path: "/",
      element: (
        <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
          <VideoSnapshotsGallery snapshots={snapshots} />
        </ApplicationConfigurationContext.Provider>
      ),
    },
  ])

  return render(<RouterProvider router={router} />)
}

describe("VideoSnapshotsGallery", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render empty gallery when no snapshots", () => {
    renderWithRouter([])

    expect(screen.queryByAltText("video snapshot")).not.toBeInTheDocument()
  })

  test("should render snapshots", () => {
    renderWithRouter([
      createMockSnapshot("snap-1", 30),
      createMockSnapshot("snap-2", 60),
    ])

    const images = screen.getAllByAltText("video snapshot")
    expect(images).toHaveLength(2)
  })

  test("should sort snapshots by timestamp", () => {
    renderWithRouter([
      createMockSnapshot("snap-2", 120),
      createMockSnapshot("snap-1", 30),
      createMockSnapshot("snap-3", 60),
    ])

    const timestamps = screen.getAllByText(/\d+:\d+/)
    expect(timestamps[0]).toHaveTextContent("0:30")
    expect(timestamps[1]).toHaveTextContent("1:00")
    expect(timestamps[2]).toHaveTextContent("2:00")
  })

  test("should link to video with timestamp", () => {
    renderWithRouter([createMockSnapshot("snap-1", 90)])

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/video/video-123?timestamp=90")
  })

  test("should display formatted timestamp", () => {
    renderWithRouter([
      createMockSnapshot("snap-1", 65),
    ])

    expect(screen.getByText("1:05")).toBeInTheDocument()
  })

  test("should use safe mode image URL when safe mode is enabled", async () => {
    const { imageUrl } = await import("~/services/asset/AssetService")

    const contextValue = {
      safeMode: true,
      theme: Theme.Light,
      setSafeMode: vi.fn(),
      setTheme: vi.fn(),
    }

    const router = createMemoryRouter([
      {
        path: "/",
        element: (
          <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
            <VideoSnapshotsGallery snapshots={[createMockSnapshot("snap-1", 30)]} />
          </ApplicationConfigurationContext.Provider>
        ),
      },
    ])

    render(<RouterProvider router={router} />)

    expect(imageUrl).toHaveBeenCalledWith(expect.anything(), true)
  })
})
