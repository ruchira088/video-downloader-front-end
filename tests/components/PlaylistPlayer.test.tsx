import { describe, expect, test, vi, beforeEach, beforeAll } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PlaylistPlayer from "~/pages/authenticated/playlists/components/PlaylistPlayer"
import React from "react"
import { buildVideo } from "../fixtures"

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

const defaultProps = {
  videos: [
    buildVideo({ id: "video-1", title: "First Video" }),
    buildVideo({ id: "video-2", title: "Second Video" }),
    buildVideo({ id: "video-3", title: "Third Video" }),
    buildVideo({ id: "video-4", title: "Fourth Video" }),
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

  describe("Media loading", () => {
    test("should reload the media when a different video moves into the current position", () => {
      const { rerender } = render(<PlaylistPlayer {...defaultProps} currentIndex={1} />)
      vi.mocked(window.HTMLMediaElement.prototype.load).mockClear()

      rerender(<PlaylistPlayer {...defaultProps} videos={defaultProps.videos.slice(1)} currentIndex={1} />)

      expect(screen.getByText("Third Video")).toBeInTheDocument()
      expect(window.HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(1)
    })

    test("should not reload the media when the same video moves to a new position", () => {
      const { rerender } = render(<PlaylistPlayer {...defaultProps} currentIndex={1} />)
      vi.mocked(window.HTMLMediaElement.prototype.load).mockClear()

      rerender(<PlaylistPlayer {...defaultProps} videos={defaultProps.videos.slice(1)} currentIndex={0} />)

      expect(window.HTMLMediaElement.prototype.load).not.toHaveBeenCalled()
    })
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

      const closeButton = screen.getByRole("button", { name: "Close player" })
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })

    test("should call onShuffle when shuffle button is clicked", async () => {
      const user = userEvent.setup()
      const onShuffle = vi.fn()
      render(<PlaylistPlayer {...defaultProps} onShuffle={onShuffle} />)

      const shuffleButton = screen.getByRole("button", { name: "Shuffle" })
      await user.click(shuffleButton)

      expect(onShuffle).toHaveBeenCalled()
    })

    test("should call onNext when next button is clicked", async () => {
      const user = userEvent.setup()
      const onNext = vi.fn()
      render(<PlaylistPlayer {...defaultProps} onNext={onNext} />)

      const nextButton = screen.getByRole("button", { name: "Next video" })
      await user.click(nextButton)

      expect(onNext).toHaveBeenCalled()
    })

    test("should call onPrevious when previous button is clicked", async () => {
      const user = userEvent.setup()
      const onPrevious = vi.fn()
      render(<PlaylistPlayer {...defaultProps} currentIndex={1} onPrevious={onPrevious} />)

      const prevButton = screen.getByRole("button", { name: "Previous video" })
      await user.click(prevButton)

      expect(onPrevious).toHaveBeenCalled()
    })
  })

  describe("Accessibility", () => {
    test("should announce whether shuffle is on", () => {
      const { rerender } = render(<PlaylistPlayer {...defaultProps} isShuffled={false} />)
      expect(screen.getByRole("button", { name: "Shuffle" })).toHaveAttribute("aria-pressed", "false")

      rerender(<PlaylistPlayer {...defaultProps} isShuffled={true} />)
      expect(screen.getByRole("button", { name: "Shuffle" })).toHaveAttribute("aria-pressed", "true")
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

      await user.click(screen.getByRole("button", { name: /Second Video/ }))

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
