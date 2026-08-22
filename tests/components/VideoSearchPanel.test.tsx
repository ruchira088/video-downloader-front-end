import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import VideoSearchPanel from "~/pages/authenticated/playlists/components/VideoSearchPanel"
import React from "react"
import { buildVideo } from "../fixtures"
import { None } from "~/types/Option"

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
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
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

      consoleSpy.mockRestore()
    })

  })
})
