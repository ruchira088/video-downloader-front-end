import { describe, expect, test, vi, beforeEach, beforeAll } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PlaylistPlayer from "~/pages/authenticated/playlists/components/PlaylistPlayer"
import React from "react"
import { DateTime, Duration } from "luxon"
import { FileResourceType } from "~/models/FileResource"

vi.mock("~/providers/ApplicationConfigurationProvider", () => ({
  useApplicationConfiguration: () => ({
    safeMode: false,
  }),
}))

// Mock HTMLVideoElement play method
beforeAll(() => {
  window.HTMLMediaElement.prototype.load = vi.fn()
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  window.HTMLMediaElement.prototype.pause = vi.fn()
})

const createMockVideo = (id: string, title: string) => ({
  videoMetadata: {
    id,
    url: `https://example.com/video/${id}`,
    videoSite: "TestSite",
    title,
    duration: Duration.fromObject({ minutes: 5, seconds: 30 }),
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

const defaultProps = {
  videos: [
    createMockVideo("video-1", "First Video"),
    createMockVideo("video-2", "Second Video"),
    createMockVideo("video-3", "Third Video"),
    createMockVideo("video-4", "Fourth Video"),
  ],
  currentIndex: 0,
  onNext: vi.fn(),
  onPrevious: vi.fn(),
  onClose: vi.fn(),
  onIndexChange: vi.fn(),
  isShuffled: false,
  onShuffle: vi.fn(),
}

describe("PlaylistPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Display", () => {
    test("should display current video title", () => {
      render(<PlaylistPlayer {...defaultProps} />)

      expect(screen.getByText("First Video")).toBeInTheDocument()
    })

    test("should display current position", () => {
      render(<PlaylistPlayer {...defaultProps} />)

      expect(screen.getByText("1 / 4")).toBeInTheDocument()
    })

    test("should display correct position when on second video", () => {
      render(<PlaylistPlayer {...defaultProps} currentIndex={1} />)

      expect(screen.getByText("2 / 4")).toBeInTheDocument()
    })

    test("should display Up Next section with upcoming videos", () => {
      render(<PlaylistPlayer {...defaultProps} />)

      expect(screen.getByText("Up Next")).toBeInTheDocument()
      expect(screen.getByText("Second Video")).toBeInTheDocument()
      expect(screen.getByText("Third Video")).toBeInTheDocument()
      expect(screen.getByText("Fourth Video")).toBeInTheDocument()
    })

    test("should not display Up Next when on last video", () => {
      render(<PlaylistPlayer {...defaultProps} currentIndex={3} />)

      expect(screen.queryByText("Up Next")).not.toBeInTheDocument()
    })
  })

  describe("Controls", () => {
    test("should call onClose when close button is clicked", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<PlaylistPlayer {...defaultProps} onClose={onClose} />)

      const closeButton = screen.getAllByRole("button")[0]
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })

    test("should call onShuffle when shuffle button is clicked", async () => {
      const user = userEvent.setup()
      const onShuffle = vi.fn()
      render(<PlaylistPlayer {...defaultProps} onShuffle={onShuffle} />)

      const shuffleButton = screen.getAllByRole("button")[2]
      await user.click(shuffleButton)

      expect(onShuffle).toHaveBeenCalled()
    })

    test("should call onNext when next button is clicked", async () => {
      const user = userEvent.setup()
      const onNext = vi.fn()
      render(<PlaylistPlayer {...defaultProps} onNext={onNext} />)

      const nextButton = screen.getAllByRole("button")[3]
      await user.click(nextButton)

      expect(onNext).toHaveBeenCalled()
    })

    test("should call onPrevious when previous button is clicked", async () => {
      const user = userEvent.setup()
      const onPrevious = vi.fn()
      render(<PlaylistPlayer {...defaultProps} currentIndex={1} onPrevious={onPrevious} />)

      const prevButton = screen.getAllByRole("button")[1]
      await user.click(prevButton)

      expect(onPrevious).toHaveBeenCalled()
    })
  })

  describe("Video Ended", () => {
    test("should call onNext when video ends", () => {
      const onNext = vi.fn()
      render(<PlaylistPlayer {...defaultProps} onNext={onNext} />)

      const video = document.querySelector("video")
      if (video) {
        fireEvent.ended(video)
      }

      expect(onNext).toHaveBeenCalled()
    })
  })

  describe("Up Next Interaction", () => {
    test("should call onIndexChange when clicking on an Up Next item", async () => {
      const user = userEvent.setup()
      const onIndexChange = vi.fn()
      render(<PlaylistPlayer {...defaultProps} onIndexChange={onIndexChange} />)

      await user.click(screen.getByText("Second Video"))

      expect(onIndexChange).toHaveBeenCalledWith(1)
    })
  })

  describe("Empty State", () => {
    test("should return null when videos array is empty", () => {
      const { container } = render(
        <PlaylistPlayer {...defaultProps} videos={[]} currentIndex={0} />
      )

      expect(container.firstChild).toBeNull()
    })
  })
})
