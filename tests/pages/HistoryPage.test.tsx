import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import HistoryPage from "~/pages/authenticated/history/HistoryPage"
import { createMemoryRouter, RouterProvider } from "react-router"
import { DateTime, Duration } from "luxon"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"

vi.mock("~/services/history/HistoryService", () => ({
  getVideoHistory: vi.fn(),
}))

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
}))

vi.mock("~/services/video/VideoService", () => ({
  fetchVideoSnapshotsByVideoId: vi.fn().mockResolvedValue([]),
}))

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>,
}))

const createMockVideoWatchHistory = (id: string) => ({
  video: {
    videoMetadata: {
      url: `https://example.com/video/${id}`,
      id,
      videoSite: "youtube",
      title: `Test Video ${id}`,
      duration: Duration.fromObject({ minutes: 5 }),
      size: 1024000000,
      thumbnail: {
        id: `thumb-${id}`,
        type: "thumbnail" as const,
        createdAt: DateTime.now(),
        path: "/path/to/thumb",
        mediaType: "image/jpeg",
        size: 1024,
      },
    },
    fileResource: {
      id: `file-${id}`,
      type: "video" as const,
      createdAt: DateTime.now(),
      path: "/path/to/video",
      mediaType: "video/mp4",
      size: 1024000000,
    },
    createdAt: DateTime.now(),
    watchTime: Duration.fromObject({ minutes: 2 }),
  },
  watchedAt: DateTime.now(),
})

const renderWithRouter = (component: React.ReactElement) => {
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
          {component}
        </ApplicationConfigurationContext.Provider>
      ),
    },
  ])

  return render(<RouterProvider router={router} />)
}

describe("HistoryPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { getVideoHistory } = await import("~/services/history/HistoryService")
    vi.mocked(getVideoHistory).mockResolvedValue([
      createMockVideoWatchHistory("video-1"),
      createMockVideoWatchHistory("video-2"),
    ])
  })

  test("should render history page", async () => {
    renderWithRouter(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
    })
  })

  test("should fetch video history on mount", async () => {
    const { getVideoHistory } = await import("~/services/history/HistoryService")

    renderWithRouter(<HistoryPage />)

    await waitFor(() => {
      expect(getVideoHistory).toHaveBeenCalledWith(0, 50)
    })
  })

  test("should render video cards for each history entry", async () => {
    renderWithRouter(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText(/Test Video video-1/)).toBeInTheDocument()
      expect(screen.getByText(/Test Video video-2/)).toBeInTheDocument()
    })
  })

  test("should not duplicate videos with same id", async () => {
    const { getVideoHistory } = await import("~/services/history/HistoryService")
    vi.mocked(getVideoHistory).mockResolvedValueOnce([
      createMockVideoWatchHistory("video-1"),
      createMockVideoWatchHistory("video-1"),
    ])

    renderWithRouter(<HistoryPage />)

    await waitFor(() => {
      const videoElements = screen.getAllByText(/Test Video video-1/)
      expect(videoElements).toHaveLength(1)
    })
  })
})
