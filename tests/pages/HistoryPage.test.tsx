import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import HistoryPage from "~/pages/authenticated/history/HistoryPage"
import { createMemoryRouter, RouterProvider } from "react-router"
import { DateTime, Duration } from "luxon"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import { FileResourceType } from "~/models/FileResource"
import React from "react"
import { intersectionObserverCallbacks } from "../setup"

const triggerIntersection = async () => {
  const callback = intersectionObserverCallbacks[intersectionObserverCallbacks.length - 1]
  await act(async () => {
    callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
  })
}

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
  id: `history-${id}`,
  duration: Duration.fromObject({ minutes: 2 }),
  userId: "user-123",
  createdAt: DateTime.now(),
  lastUpdatedAt: DateTime.now(),
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
        type: FileResourceType.Thumbnail as const,
        createdAt: DateTime.now(),
        path: "/path/to/thumb",
        mediaType: "image/jpeg",
        size: 1024,
      },
    },
    fileResource: {
      id: `file-${id}`,
      type: FileResourceType.Video as const,
      createdAt: DateTime.now(),
      path: "/path/to/video",
      mediaType: "video/mp4",
      size: 1024000000,
    },
    createdAt: DateTime.now(),
    watchTime: Duration.fromObject({ minutes: 2 }),
  },
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

  describe("Pagination", () => {
    beforeEach(() => {
      intersectionObserverCallbacks.length = 0
    })

    test("should load the next page when scroll trigger intersects", async () => {
      const { getVideoHistory } = await import("~/services/history/HistoryService")
      const fullFirstPage = Array.from({ length: 50 }, (_, i) =>
        createMockVideoWatchHistory(`page0-${i}`)
      )
      vi.mocked(getVideoHistory)
        .mockResolvedValueOnce(fullFirstPage)
        .mockResolvedValueOnce([createMockVideoWatchHistory("page1-video")])

      renderWithRouter(<HistoryPage />)

      await waitFor(() => {
        expect(screen.getByText(/Test Video page0-0/)).toBeInTheDocument()
      })
      expect(vi.mocked(getVideoHistory)).toHaveBeenCalledWith(0, 50)
      expect(vi.mocked(getVideoHistory)).toHaveBeenCalledTimes(1)

      await triggerIntersection()

      await waitFor(() => {
        expect(vi.mocked(getVideoHistory)).toHaveBeenCalledWith(1, 50)
      })

      await waitFor(() => {
        expect(screen.getByText(/Test Video page1-video/)).toBeInTheDocument()
      })
    })

    test("should not load more when results are less than page size", async () => {
      const { getVideoHistory } = await import("~/services/history/HistoryService")
      vi.mocked(getVideoHistory).mockResolvedValue([
        createMockVideoWatchHistory("only-video"),
      ])

      renderWithRouter(<HistoryPage />)

      await waitFor(() => {
        expect(screen.getByText(/Test Video only-video/)).toBeInTheDocument()
      })

      const callsBefore = vi.mocked(getVideoHistory).mock.calls.length
      await triggerIntersection()
      expect(vi.mocked(getVideoHistory).mock.calls.length).toBe(callsBefore)
    })
  })
})
