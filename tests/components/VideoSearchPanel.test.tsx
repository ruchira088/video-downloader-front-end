import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import VideoSearchPanel from "~/pages/authenticated/playlists/components/VideoSearchPanel"
import React from "react"
import { buildVideo } from "../fixtures"
import { None } from "~/types/Option"
import { triggerIntersection } from "../helpers"

vi.mock("~/services/video/VideoService", () => ({
  searchVideos: vi.fn(),
  videoServiceSummary: vi.fn().mockResolvedValue({ sites: ["TestSite"] }),
}))

vi.mock("~/providers/ApplicationConfigurationProvider", () => ({
  useApplicationConfiguration: () => ({
    safeMode: false,
  }),
}))

import { searchVideos } from "~/services/video/VideoService"

const mockSearchVideos = vi.mocked(searchVideos)

describe("VideoSearchPanel", () => {
  const mockOnVideoSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("Initial Render", () => {
    test("should show loading spinner initially", async () => {
      mockSearchVideos.mockImplementation(() => new Promise(() => {}))

      render(
        <VideoSearchPanel
          onVideoSelect={mockOnVideoSelect}
          existingVideoIds={[]}
        />
      )

      await act(async () => { vi.advanceTimersByTime(300) })

      await waitFor(() => {
        expect(screen.getByRole("progressbar")).toBeInTheDocument()
      })
    })
  })

  describe("Search Results", () => {
    test("should display search results", async () => {
      mockSearchVideos.mockResolvedValue({
        results: [
          buildVideo({ id: "video-1", title: "First Video" }),
          buildVideo({ id: "video-2", title: "Second Video" }),
        ],
        pageNumber: 0,
        pageSize: 50,
        searchTerm: None.of(),
      })

      render(
        <VideoSearchPanel
          onVideoSelect={mockOnVideoSelect}
          existingVideoIds={[]}
        />
      )

      await act(async () => { vi.advanceTimersByTime(300) })

      await waitFor(() => {
        expect(screen.getByText("First Video")).toBeInTheDocument()
        expect(screen.getByText("Second Video")).toBeInTheDocument()
      })
    })

    test("should filter out existing videos", async () => {
      mockSearchVideos.mockResolvedValue({
        results: [
          buildVideo({ id: "video-1", title: "First Video" }),
          buildVideo({ id: "video-2", title: "Second Video" }),
        ],
        pageNumber: 0,
        pageSize: 50,
        searchTerm: None.of(),
      })

      render(
        <VideoSearchPanel
          onVideoSelect={mockOnVideoSelect}
          existingVideoIds={["video-1"]}
        />
      )

      await act(async () => { vi.advanceTimersByTime(300) })

      await waitFor(() => {
        expect(screen.queryByText("First Video")).not.toBeInTheDocument()
        expect(screen.getByText("Second Video")).toBeInTheDocument()
      })
    })

    test("should show message when all videos are in playlist", async () => {
      mockSearchVideos.mockResolvedValue({
        results: [
          buildVideo({ id: "video-1", title: "First Video" }),
        ],
        pageNumber: 0,
        pageSize: 50,
        searchTerm: None.of(),
      })

      render(
        <VideoSearchPanel
          onVideoSelect={mockOnVideoSelect}
          existingVideoIds={["video-1"]}
        />
      )

      await act(async () => { vi.advanceTimersByTime(300) })

      await waitFor(() => {
        expect(screen.getByText("All videos already in playlist")).toBeInTheDocument()
      })
    })

    test("should display hint text", async () => {
      mockSearchVideos.mockResolvedValue({
        results: [
          buildVideo({ id: "video-1", title: "First Video" }),
        ],
        pageNumber: 0,
        pageSize: 50,
        searchTerm: None.of(),
      })

      render(
        <VideoSearchPanel
          onVideoSelect={mockOnVideoSelect}
          existingVideoIds={[]}
        />
      )

      await act(async () => { vi.advanceTimersByTime(300) })

      await waitFor(() => {
        expect(screen.getByText("Click + to add videos to playlist")).toBeInTheDocument()
      })
    })
  })

  describe("Adding Videos", () => {
    test("should call onVideoSelect when add button is clicked", async () => {
      vi.useRealTimers()
      const user = userEvent.setup()
      mockSearchVideos.mockResolvedValue({
        results: [
          buildVideo({ id: "video-1", title: "First Video" }),
        ],
        pageNumber: 0,
        pageSize: 50,
        searchTerm: None.of(),
      })
      mockOnVideoSelect.mockResolvedValue(undefined)

      render(
        <VideoSearchPanel
          onVideoSelect={mockOnVideoSelect}
          existingVideoIds={[]}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("First Video")).toBeInTheDocument()
      })

      const addButton = screen.getByRole("button")
      await user.click(addButton)

      await waitFor(() => {
        expect(mockOnVideoSelect).toHaveBeenCalledWith("video-1")
      })
    })
  })

  describe("Search Error Handling", () => {
    test("should handle search error gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      mockSearchVideos.mockRejectedValue(new Error("Network error"))

      render(
        <VideoSearchPanel
          onVideoSelect={mockOnVideoSelect}
          existingVideoIds={[]}
        />
      )

      await act(async () => { vi.advanceTimersByTime(300) })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      // The list offers a way out rather than stalling on an empty panel.
      expect(screen.getByRole("alert")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe("Pagination", () => {
    test("should not show a video twice when a later page repeats it", async () => {
      const firstPage = Array.from({ length: 20 }, (_, i) => buildVideo({ id: `video-${i}`, title: `Video ${i}` }))
      mockSearchVideos
        .mockResolvedValueOnce({ results: firstPage, pageNumber: 0, pageSize: 20, searchTerm: None.of() })
        .mockResolvedValueOnce({
          // A newly downloaded video shifted the offsets, so the last video of page 0 repeats.
          results: [buildVideo({ id: "video-19", title: "Video 19" }), buildVideo({ id: "video-20", title: "Video 20" })],
          pageNumber: 1,
          pageSize: 20,
          searchTerm: None.of(),
        })

      render(<VideoSearchPanel onVideoSelect={mockOnVideoSelect} existingVideoIds={[]} />)

      await act(async () => { vi.advanceTimersByTime(300) })
      await waitFor(() => {
        expect(screen.getByText("Video 19")).toBeInTheDocument()
      })

      await triggerIntersection()

      await waitFor(() => {
        expect(screen.getByText("Video 20")).toBeInTheDocument()
      })
      expect(screen.getAllByText("Video 19")).toHaveLength(1)
    })
  })
})
