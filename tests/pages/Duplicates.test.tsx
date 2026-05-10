import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Duplicates from "~/pages/authenticated/duplicates/Duplicates"
import { createMemoryRouter, RouterProvider } from "react-router"
import { DateTime, Duration } from "luxon"
import { FileResourceType } from "~/models/FileResource"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"
import { intersectionObserverCallbacks } from "../setup"

vi.mock("~/services/video/VideoService", () => ({
  fetchDuplicateVideos: vi.fn(),
  fetchVideoById: vi.fn(),
  deleteVideo: vi.fn(),
}))

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
}))

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>,
}))

import {
  fetchDuplicateVideos,
  fetchVideoById,
  deleteVideo,
} from "~/services/video/VideoService"

const mockFetchDuplicateVideos = vi.mocked(fetchDuplicateVideos)
const mockFetchVideoById = vi.mocked(fetchVideoById)
const mockDeleteVideo = vi.mocked(deleteVideo)

const createMockVideo = (id: string, title: string = `Title ${id}`) => ({
  videoMetadata: {
    id,
    url: `https://example.com/video/${id}`,
    videoSite: "youtube",
    title,
    duration: Duration.fromObject({ minutes: 5 }),
    size: 1024 * 1024 * 100,
    thumbnail: {
      id: `thumb-${id}`,
      type: FileResourceType.Thumbnail as const,
      createdAt: DateTime.now(),
      path: `/thumbnails/${id}.jpg`,
      mediaType: "image/jpeg",
      size: 1024,
    },
  },
  fileResource: {
    id: `file-${id}`,
    type: FileResourceType.Video as const,
    createdAt: DateTime.now(),
    path: `/videos/${id}.mp4`,
    mediaType: "video/mp4",
    size: 1024 * 1024 * 100,
  },
  createdAt: DateTime.now(),
  watchTime: Duration.fromObject({ minutes: 0 }),
})

const createDuplicateGroup = (groupId: string, videoIds: string[]) =>
  videoIds.map(id => ({
    videoId: id,
    duplicateGroupId: groupId,
    createdAt: DateTime.now(),
  }))

const renderPage = () => {
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
          <Duplicates />
        </ApplicationConfigurationContext.Provider>
      ),
    },
    {
      path: "/video/:videoId",
      element: <div>Video Page</div>,
    },
  ])

  return render(<RouterProvider router={router} />)
}

const triggerIntersection = async () => {
  const callback = intersectionObserverCallbacks[intersectionObserverCallbacks.length - 1]
  await act(async () => {
    callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
  })
}

describe("Duplicates", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    intersectionObserverCallbacks.length = 0
    mockFetchVideoById.mockImplementation(async (id: string) =>
      createMockVideo(id, `Video ${id}`)
    )
  })

  test("should render empty state when no duplicates are found", async () => {
    mockFetchDuplicateVideos.mockResolvedValue({})

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("No duplicate videos found")).toBeInTheDocument()
    })
  })

  test("should render duplicate groups with video cards", async () => {
    mockFetchDuplicateVideos.mockResolvedValue({
      "group-1": createDuplicateGroup("group-1", ["video-1", "video-2"]),
      "group-2": createDuplicateGroup("group-2", ["video-3", "video-4", "video-5"]),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Video video-1")).toBeInTheDocument()
      expect(screen.getByText("Video video-2")).toBeInTheDocument()
      expect(screen.getByText("Video video-3")).toBeInTheDocument()
    })

    expect(screen.getByText("2 duplicate videos")).toBeInTheDocument()
    expect(screen.getByText("3 duplicate videos")).toBeInTheDocument()
  })

  test("should call deleteVideo and remove video from group when delete is clicked", async () => {
    const user = userEvent.setup()
    mockFetchDuplicateVideos.mockResolvedValue({
      "group-1": createDuplicateGroup("group-1", ["video-1", "video-2", "video-3"]),
    })
    mockDeleteVideo.mockResolvedValue(createMockVideo("video-1"))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Video video-1")).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i })
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockDeleteVideo).toHaveBeenCalledWith("video-1", true)
    })

    await waitFor(() => {
      expect(screen.queryByText("Video video-1")).not.toBeInTheDocument()
    })

    // Group should still exist with 2 videos remaining
    expect(screen.getByText("Video video-2")).toBeInTheDocument()
    expect(screen.getByText("Video video-3")).toBeInTheDocument()
  })

  test("should remove the entire group when only one video remains after deletion", async () => {
    const user = userEvent.setup()
    mockFetchDuplicateVideos.mockResolvedValue({
      "group-1": createDuplicateGroup("group-1", ["video-1", "video-2"]),
    })
    mockDeleteVideo.mockResolvedValue(createMockVideo("video-1"))

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Video video-1")).toBeInTheDocument()
      expect(screen.getByText("2 duplicate videos")).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i })
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockDeleteVideo).toHaveBeenCalled()
    })

    // After deletion, group has only 1 video left → group should be removed entirely
    await waitFor(() => {
      expect(screen.queryByText("2 duplicate videos")).not.toBeInTheDocument()
      expect(screen.queryByText("Video video-1")).not.toBeInTheDocument()
      expect(screen.queryByText("Video video-2")).not.toBeInTheDocument()
    })
  })

  test("should render links to video pages", async () => {
    mockFetchDuplicateVideos.mockResolvedValue({
      "group-1": createDuplicateGroup("group-1", ["video-1", "video-2"]),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Video video-1")).toBeInTheDocument()
    })

    const links = screen.getAllByRole("link")
    const hrefs = links.map(l => l.getAttribute("href"))
    expect(hrefs).toContain("/video/video-1")
    expect(hrefs).toContain("/video/video-2")
  })

  test("should fetch the next page when scroll trigger intersects", async () => {
    mockFetchDuplicateVideos
      .mockResolvedValueOnce(
        Object.fromEntries(
          Array.from({ length: 25 }, (_, i) => [
            `group-page-0-${i}`,
            createDuplicateGroup(`group-page-0-${i}`, [`v0-${i}-a`, `v0-${i}-b`]),
          ])
        )
      )
      .mockResolvedValueOnce({
        "group-page-1": createDuplicateGroup("group-page-1", ["v1-a", "v1-b"]),
      })

    renderPage()

    await waitFor(() => {
      expect(mockFetchDuplicateVideos).toHaveBeenCalledWith(0, 25)
    })

    // Wait for first page to render
    await waitFor(() => {
      expect(screen.getByText("Video v0-0-a")).toBeInTheDocument()
    })

    // Trigger the intersection observer to load more
    await triggerIntersection()

    await waitFor(() => {
      expect(mockFetchDuplicateVideos).toHaveBeenCalledWith(1, 25)
    })

    await waitFor(() => {
      expect(screen.getByText("Video v1-a")).toBeInTheDocument()
    })
  })

  test("should not refetch a page that has already been fetched", async () => {
    mockFetchDuplicateVideos.mockResolvedValue({
      "group-1": createDuplicateGroup("group-1", ["video-1", "video-2"]),
    })

    renderPage()

    await waitFor(() => {
      expect(mockFetchDuplicateVideos).toHaveBeenCalledTimes(1)
    })

    // Less-than-PAGE_SIZE results sets hasMore=false; intersection should not load more
    await triggerIntersection()

    // No additional fetch should have happened
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(mockFetchDuplicateVideos).toHaveBeenCalledTimes(1)
  })

  test("should deduplicate groups already loaded across pages", async () => {
    // Page 0 returns a full page so hasMore stays true
    const page0 = Object.fromEntries(
      Array.from({ length: 25 }, (_, i) => [
        `group-${i}`,
        createDuplicateGroup(`group-${i}`, [`p0-${i}-a`, `p0-${i}-b`]),
      ])
    )
    // Page 1 includes one duplicate group id from page 0 plus a new one
    const page1 = {
      "group-0": createDuplicateGroup("group-0", ["p0-0-a", "p0-0-b"]),
      "group-new": createDuplicateGroup("group-new", ["new-a", "new-b"]),
    }
    mockFetchDuplicateVideos
      .mockResolvedValueOnce(page0)
      .mockResolvedValueOnce(page1)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("Video p0-0-a")).toBeInTheDocument()
    })

    // fetchVideoById should be called once per unique video on page 0 (50 total)
    const initialFetchCount = mockFetchVideoById.mock.calls.length

    await triggerIntersection()

    await waitFor(() => {
      expect(screen.getByText("Video new-a")).toBeInTheDocument()
    })

    // Only the genuinely new group's videos should have been fetched, not the duplicate group's
    const finalFetchCount = mockFetchVideoById.mock.calls.length
    expect(finalFetchCount - initialFetchCount).toBe(2)
  })
})
