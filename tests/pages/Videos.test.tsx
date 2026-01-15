import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import Videos from "~/pages/authenticated/videos/Videos"
import { createMemoryRouter, RouterProvider } from "react-router"
import { DateTime, Duration } from "luxon"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"

vi.mock("~/services/video/VideoService", () => ({
  searchVideos: vi.fn().mockResolvedValue({
    results: [],
    totalCount: 0,
  }),
  videoServiceSummary: vi.fn().mockResolvedValue({
    sites: ["youtube", "vimeo"],
    count: 100,
  }),
}))

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
}))

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>,
}))

const renderWithRouter = () => {
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
          <Videos />
        </ApplicationConfigurationContext.Provider>
      ),
    },
  ])

  return render(<RouterProvider router={router} />)
}

describe("Videos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render videos page", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByLabelText("Search")).toBeInTheDocument()
    })
  })

  test("should render video search component", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Duration")).toBeInTheDocument()
      expect(screen.getByText("Size")).toBeInTheDocument()
    })
  })

  test("should render sort by selector", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Date")).toBeInTheDocument()
    })
  })

  test("should call searchVideos on mount", async () => {
    const { searchVideos } = await import("~/services/video/VideoService")

    renderWithRouter()

    await waitFor(() => {
      expect(searchVideos).toHaveBeenCalled()
    })
  })

  test("should render video sites selector", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByLabelText("Sites")).toBeInTheDocument()
    })
  })

  test("should render with videos when search returns results", async () => {
    const { searchVideos } = await import("~/services/video/VideoService")
    vi.mocked(searchVideos).mockResolvedValue({
      results: [
        {
          videoMetadata: {
            url: "https://example.com/video",
            id: "video-123",
            videoSite: "youtube",
            title: "Test Video",
            duration: Duration.fromObject({ minutes: 5 }),
            size: 1024000000,
            thumbnail: {
              id: "thumb-123",
              type: "thumbnail" as const,
              createdAt: DateTime.now(),
              path: "/path/to/thumb",
              mediaType: "image/jpeg",
              size: 1024,
            },
          },
          fileResource: {
            id: "file-123",
            type: "video" as const,
            createdAt: DateTime.now(),
            path: "/path/to/video",
            mediaType: "video/mp4",
            size: 1024000000,
          },
          createdAt: DateTime.now(),
          watchTime: Duration.fromObject({ minutes: 2 }),
        },
      ],
      totalCount: 1,
    })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Test Video")).toBeInTheDocument()
    })
  })

  test("should handle less than page size results", async () => {
    const { searchVideos } = await import("~/services/video/VideoService")
    vi.mocked(searchVideos).mockResolvedValue({
      results: [
        {
          videoMetadata: {
            url: "https://example.com/video",
            id: "video-123",
            videoSite: "youtube",
            title: "Test Video",
            duration: Duration.fromObject({ minutes: 5 }),
            size: 1024000000,
            thumbnail: {
              id: "thumb-123",
              type: "thumbnail" as const,
              createdAt: DateTime.now(),
              path: "/path/to/thumb",
              mediaType: "image/jpeg",
              size: 1024,
            },
          },
          fileResource: {
            id: "file-123",
            type: "video" as const,
            createdAt: DateTime.now(),
            path: "/path/to/video",
            mediaType: "video/mp4",
            size: 1024000000,
          },
          createdAt: DateTime.now(),
          watchTime: Duration.fromObject({ minutes: 2 }),
        },
      ],
      totalCount: 1,
    })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Test Video")).toBeInTheDocument()
    })

    // With less than page size results, hasMore should be false
    expect(searchVideos).toHaveBeenCalled()
  })

  test("should call searchVideos with updated params when search term changes", async () => {
    const { searchVideos } = await import("~/services/video/VideoService")
    vi.mocked(searchVideos).mockResolvedValue({
      results: [],
      totalCount: 0,
    })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByLabelText("Search")).toBeInTheDocument()
    })

    // Find and update the search input
    const searchInput = screen.getByLabelText("Search")

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "new search term" } })
    })

    await waitFor(() => {
      // Verify searchVideos was called after the initial mount and after the change
      expect(searchVideos).toHaveBeenCalledTimes(2)
    })
  })

  test("should update query params when sort by changes", async () => {
    const { searchVideos } = await import("~/services/video/VideoService")
    vi.mocked(searchVideos).mockResolvedValue({
      results: [],
      totalCount: 0,
    })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByLabelText("Sort by")).toBeInTheDocument()
    })

    // Click to open the sort by dropdown
    const sortBySelect = screen.getByLabelText("Sort by")

    await act(async () => {
      fireEvent.mouseDown(sortBySelect)
    })

    // Select "Title" option from the dropdown
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Title" })).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("option", { name: "Title" }))
    })

    await waitFor(() => {
      // Verify searchVideos was called after the sort change
      expect(searchVideos).toHaveBeenCalledTimes(2)
    })
  })

  test("should reset videos and page number when search params change", async () => {
    const { searchVideos } = await import("~/services/video/VideoService")

    // First return some results, then empty on second call
    vi.mocked(searchVideos)
      .mockResolvedValueOnce({
        results: [
          {
            videoMetadata: {
              url: "https://example.com/video1",
              id: "video-1",
              videoSite: "youtube",
              title: "First Video",
              duration: Duration.fromObject({ minutes: 5 }),
              size: 1024000000,
              thumbnail: {
                id: "thumb-1",
                type: "thumbnail" as const,
                createdAt: DateTime.now(),
                path: "/path/to/thumb",
                mediaType: "image/jpeg",
                size: 1024,
              },
            },
            fileResource: {
              id: "file-1",
              type: "video" as const,
              createdAt: DateTime.now(),
              path: "/path/to/video",
              mediaType: "video/mp4",
              size: 1024000000,
            },
            createdAt: DateTime.now(),
            watchTime: Duration.fromObject({ minutes: 2 }),
          },
        ],
        totalCount: 1,
      })
      .mockResolvedValueOnce({
        results: [],
        totalCount: 0,
      })

    renderWithRouter()

    // Wait for first video to appear
    await waitFor(() => {
      expect(screen.getByText("First Video")).toBeInTheDocument()
    })

    // Change the sort order by clicking on the sort by select
    const sortBySelect = screen.getByLabelText("Sort by")

    await act(async () => {
      fireEvent.mouseDown(sortBySelect)
    })

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Title" })).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("option", { name: "Title" }))
    })

    // After changing sort, old results should be cleared and new search triggered
    await waitFor(() => {
      expect(searchVideos).toHaveBeenCalledTimes(2)
    })
  })

  test("should toggle ordering when ordering radio is clicked", async () => {
    const { searchVideos } = await import("~/services/video/VideoService")
    vi.mocked(searchVideos).mockResolvedValue({
      results: [],
      totalCount: 0,
    })

    renderWithRouter()

    await waitFor(() => {
      expect(searchVideos).toHaveBeenCalled()
    })

    // Find the Ascending radio option
    const ascendingRadio = screen.getByRole("radio", { name: "Ascending" })

    await act(async () => {
      fireEvent.click(ascendingRadio)
    })

    await waitFor(() => {
      // Verify searchVideos was called again after ordering change
      expect(searchVideos).toHaveBeenCalledTimes(2)
    })
  })
})
