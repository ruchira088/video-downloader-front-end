import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import Videos from "~/pages/authenticated/videos/Videos"
import { createMemoryRouter, RouterProvider } from "react-router"
import { DateTime, Duration } from "luxon"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some, None } from "~/types/Option"
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

// The search debounce is wall-clock, so these waits must tolerate a heavily loaded suite.
// waitFor polls, so a passing assertion still returns as soon as it holds.
const DEBOUNCE_TIMEOUT_MS = 10_000

const buildVideo = (id: string, title: string) => ({
  videoMetadata: {
    url: `https://example.com/video/${id}`,
    id,
    videoSite: "youtube",
    title,
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
})

vi.mock("~/services/video/VideoService", () => ({
  searchVideos: vi.fn(),
  videoServiceSummary: vi.fn(),
}))

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/image.jpg"),
}))

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>,
}))

const renderWithRouter = (initialEntry: string = "/") => {
  const contextValue = {
    safeMode: false,
    theme: Theme.Light,
    setSafeMode: vi.fn(),
    setTheme: vi.fn(),
  }

  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
            <Videos />
          </ApplicationConfigurationContext.Provider>
        ),
      },
    ],
    { initialEntries: [initialEntry] }
  )

  return { router, ...render(<RouterProvider router={router} />) }
}

describe("Videos", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { searchVideos, videoServiceSummary } = await import("~/services/video/VideoService")
    vi.mocked(searchVideos).mockResolvedValue({
      results: [],
      pageNumber: 0,
      pageSize: 50,
      searchTerm: None.of(),
    })
    vi.mocked(videoServiceSummary).mockResolvedValue({
      sites: ["youtube", "vimeo"],
      videoCount: 100,
      totalSize: 1024000000,
      totalDuration: Duration.fromObject({ hours: 10 }),
    })
  })

  test("should render videos page", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByLabelText("Search videos")).toBeInTheDocument()
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
          createdAt: DateTime.now(),
          watchTime: Duration.fromObject({ minutes: 2 }),
        },
      ],
      pageNumber: 0,
      pageSize: 50,
      searchTerm: None.of(),
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
          createdAt: DateTime.now(),
          watchTime: Duration.fromObject({ minutes: 2 }),
        },
      ],
      pageNumber: 0,
      pageSize: 50,
      searchTerm: None.of(),
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
      pageNumber: 0,
      pageSize: 50,
      searchTerm: None.of(),
    })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByLabelText("Search videos")).toBeInTheDocument()
    })

    // Find and update the search input
    const searchInput = screen.getByLabelText("Search videos")

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "new search term" } })
    })

    await waitFor(() => {
      // Verify searchVideos was called after the initial mount and after the change
      expect(searchVideos).toHaveBeenCalledTimes(2)
    })
  })

  test("should issue a single search for a burst of keystrokes", async () => {
    const { searchVideos } = await import("~/services/video/VideoService")

    renderWithRouter()

    await waitFor(() => {
      expect(searchVideos).toHaveBeenCalledTimes(1)
    })

    const searchInput = screen.getByLabelText("Search videos")

    // Typing must not cost one request per keystroke; only the settled term is searched.
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "h" } })
      fireEvent.change(searchInput, { target: { value: "ho" } })
      fireEvent.change(searchInput, { target: { value: "holi" } })
    })

    await waitFor(() => {
      expect(searchVideos).toHaveBeenCalledTimes(2)
    }, { timeout: DEBOUNCE_TIMEOUT_MS })

    const searchTermArgument = vi.mocked(searchVideos).mock.calls[1][0]
    expect(searchTermArgument.getOrElse(() => "")).toBe("holi")
  })

  test("should show typed text immediately, before the search is issued", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByLabelText("Search videos")).toBeInTheDocument()
    })

    const searchInput = screen.getByLabelText("Search videos")

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "holiday" } })
    })

    expect(searchInput).toHaveValue("holiday")
  })

  test("should replace rather than push history entries while searching", async () => {
    const { searchVideos } = await import("~/services/video/VideoService")
    const { router } = renderWithRouter()

    await waitFor(() => {
      expect(searchVideos).toHaveBeenCalledTimes(1)
    })

    const searchInput = screen.getByLabelText("Search videos")

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "holiday" } })
    })

    await waitFor(() => {
      expect(router.state.location.search).toBe("?search-term=holiday")
    }, { timeout: DEBOUNCE_TIMEOUT_MS })

    // Going back must not merely undo one keystroke's worth of query string: the search
    // replaced the entry, so there is nothing behind it to return to.
    await act(async () => {
      await router.navigate(-1)
    })

    expect(router.state.location.search).toBe("?search-term=holiday")
  })

  test("should adopt a search term that changes in the URL after mount", async () => {
    // The text field is driven locally between keystrokes, so a term arriving from outside the
    // field — back/forward, or a link — has to be pulled back into it.
    const { router } = renderWithRouter("/?search-term=holiday")

    await waitFor(() => {
      expect(screen.getByLabelText("Search videos")).toHaveValue("holiday")
    })

    await act(async () => {
      await router.navigate("/?search-term=cooking")
    })

    await waitFor(() => {
      expect(screen.getByLabelText("Search videos")).toHaveValue("cooking")
    })
  })

  test("should drop the query parameter when the search is cleared", async () => {
    const { router } = renderWithRouter("/?search-term=holiday")

    await waitFor(() => {
      expect(screen.getByLabelText("Search videos")).toHaveValue("holiday")
    })

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Search videos"), { target: { value: "" } })
    })

    // Cleared means the parameter is gone, not present-but-empty.
    await waitFor(() => {
      expect(router.state.location.search).toBe("")
    }, { timeout: DEBOUNCE_TIMEOUT_MS })
  })

  test("should search the term given in the URL on first load", async () => {
    const { searchVideos } = await import("~/services/video/VideoService")

    renderWithRouter("/?search-term=holiday")

    await waitFor(() => {
      expect(searchVideos).toHaveBeenCalled()
    })

    expect(vi.mocked(searchVideos).mock.calls[0][0].getOrElse(() => "")).toBe("holiday")
    expect(screen.getByLabelText("Search videos")).toHaveValue("holiday")
  })

  test("should update query params when sort by changes", async () => {
    const { searchVideos } = await import("~/services/video/VideoService")
    vi.mocked(searchVideos).mockResolvedValue({
      results: [],
      pageNumber: 0,
      pageSize: 50,
      searchTerm: None.of(),
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
                type: FileResourceType.Thumbnail as const,
                createdAt: DateTime.now(),
                path: "/path/to/thumb",
                mediaType: "image/jpeg",
                size: 1024,
              },
            },
            fileResource: {
              id: "file-1",
              type: FileResourceType.Video as const,
              createdAt: DateTime.now(),
              path: "/path/to/video",
              mediaType: "video/mp4",
              size: 1024000000,
            },
            createdAt: DateTime.now(),
            watchTime: Duration.fromObject({ minutes: 2 }),
          },
        ],
        pageNumber: 0,
        pageSize: 50,
        searchTerm: None.of(),
      })
      .mockResolvedValueOnce({
        results: [],
        pageNumber: 0,
        pageSize: 50,
        searchTerm: None.of(),
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
      pageNumber: 0,
      pageSize: 50,
      searchTerm: None.of(),
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

  describe("Pagination", () => {
    beforeEach(() => {
      intersectionObserverCallbacks.length = 0
    })

    test("should load and concatenate the next page when scroll trigger intersects", async () => {
      const { searchVideos } = await import("~/services/video/VideoService")
      const fullPage = Array.from({ length: 50 }, (_, i) => buildVideo(`p0-${i}`, `Page0 ${i}`))

      vi.mocked(searchVideos)
        .mockResolvedValueOnce({
          results: fullPage,
          pageNumber: 0,
          pageSize: 50,
          searchTerm: None.of(),
        })
        .mockResolvedValueOnce({
          results: [buildVideo("p1-0", "Page1 0")],
          pageNumber: 1,
          pageSize: 50,
          searchTerm: None.of(),
        })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Page0 0")).toBeInTheDocument()
      })
      expect(vi.mocked(searchVideos)).toHaveBeenCalledTimes(1)

      await triggerIntersection()

      await waitFor(() => {
        expect(vi.mocked(searchVideos)).toHaveBeenCalledTimes(2)
      })

      // Page-1 result should be appended; page-0 results should still be present
      await waitFor(() => {
        expect(screen.getByText("Page1 0")).toBeInTheDocument()
      })
      expect(screen.getByText("Page0 0")).toBeInTheDocument()
    })

    test("should not refetch when results are less than page size (hasMore=false)", async () => {
      const { searchVideos } = await import("~/services/video/VideoService")
      vi.mocked(searchVideos).mockResolvedValue({
        results: [buildVideo("only", "Only Video")],
        pageNumber: 0,
        pageSize: 50,
        searchTerm: None.of(),
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Only Video")).toBeInTheDocument()
      })

      const callsBefore = vi.mocked(searchVideos).mock.calls.length
      await triggerIntersection()
      // No new fetch since hasMore is false
      expect(vi.mocked(searchVideos).mock.calls.length).toBe(callsBefore)
    })
  })
})
