import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import VideoSearchPanel from "~/pages/authenticated/playlists/components/VideoSearchPanel"
import React from "react"
import { DateTime, Duration } from "luxon"
import { FileResourceType } from "~/models/FileResource"
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

const createMockVideo = (id: string, title: string) => ({
  videoMetadata: {
    id,
    url: `https://example.com/video/${id}`,
    videoSite: "TestSite",
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

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByRole("progressbar")).toBeInTheDocument()
      })
    })
  })

  describe("Search Results", () => {
    test("should display search results", async () => {
      mockSearchVideos.mockResolvedValue({
        results: [
          createMockVideo("video-1", "First Video"),
          createMockVideo("video-2", "Second Video"),
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

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText("First Video")).toBeInTheDocument()
        expect(screen.getByText("Second Video")).toBeInTheDocument()
      })
    })

    test("should filter out existing videos", async () => {
      mockSearchVideos.mockResolvedValue({
        results: [
          createMockVideo("video-1", "First Video"),
          createMockVideo("video-2", "Second Video"),
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

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.queryByText("First Video")).not.toBeInTheDocument()
        expect(screen.getByText("Second Video")).toBeInTheDocument()
      })
    })

    test("should show message when all videos are in playlist", async () => {
      mockSearchVideos.mockResolvedValue({
        results: [
          createMockVideo("video-1", "First Video"),
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

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByText("All videos already in playlist")).toBeInTheDocument()
      })
    })

    test("should display hint text", async () => {
      mockSearchVideos.mockResolvedValue({
        results: [
          createMockVideo("video-1", "First Video"),
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

      vi.advanceTimersByTime(300)

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
          createMockVideo("video-1", "First Video"),
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

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })

  })
})
