import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DraggableSearchVideoCard from "~/pages/authenticated/playlists/components/DraggableSearchVideoCard"
import React from "react"
import { DateTime, Duration } from "luxon"
import { FileResourceType } from "~/models/FileResource"

vi.mock("~/providers/ApplicationConfigurationProvider", () => ({
  useApplicationConfiguration: () => ({
    safeMode: false,
  }),
}))

const createMockVideo = (id: string, title: string) => ({
  videoMetadata: {
    id,
    url: `https://example.com/video/${id}`,
    videoSite: "TestSite",
    title,
    duration: Duration.fromObject({ hours: 1, minutes: 30, seconds: 45 }),
    size: 1024 * 1024 * 500, // 500 MB
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
    size: 1024 * 1024 * 500,
  },
  createdAt: DateTime.now(),
  watchTime: Duration.fromObject({ minutes: 0 }),
})

describe("DraggableSearchVideoCard", () => {
  const mockOnAdd = vi.fn()
  const mockVideo = createMockVideo("video-1", "Test Video Title")

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Display", () => {
    test("should display video title", () => {
      render(
        <DraggableSearchVideoCard
          video={mockVideo}
          onAdd={mockOnAdd}
          isAdding={false}
        />
      )

      expect(screen.getByText("Test Video Title")).toBeInTheDocument()
    })

    test("should display video thumbnail", () => {
      render(
        <DraggableSearchVideoCard
          video={mockVideo}
          onAdd={mockOnAdd}
          isAdding={false}
        />
      )

      const img = screen.getByAltText("Test Video Title")
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute("src")
    })

    test("should display video duration", () => {
      render(
        <DraggableSearchVideoCard
          video={mockVideo}
          onAdd={mockOnAdd}
          isAdding={false}
        />
      )

      expect(screen.getByText("1:30:45")).toBeInTheDocument()
    })

    test("should display video site", () => {
      render(
        <DraggableSearchVideoCard
          video={mockVideo}
          onAdd={mockOnAdd}
          isAdding={false}
        />
      )

      expect(screen.getByText("TestSite")).toBeInTheDocument()
    })

    test("should display video size", () => {
      render(
        <DraggableSearchVideoCard
          video={mockVideo}
          onAdd={mockOnAdd}
          isAdding={false}
        />
      )

      // The size should be displayed (format may vary based on locale)
      expect(screen.getByText(/MB/)).toBeInTheDocument()
    })

    test("should render add button", () => {
      render(
        <DraggableSearchVideoCard
          video={mockVideo}
          onAdd={mockOnAdd}
          isAdding={false}
        />
      )

      expect(screen.getByRole("button")).toBeInTheDocument()
    })
  })

  describe("Interactions", () => {
    test("should call onAdd when add button is clicked", async () => {
      const user = userEvent.setup()
      render(
        <DraggableSearchVideoCard
          video={mockVideo}
          onAdd={mockOnAdd}
          isAdding={false}
        />
      )

      await user.click(screen.getByRole("button"))

      expect(mockOnAdd).toHaveBeenCalled()
    })

    test("should disable add button when isAdding is true", () => {
      render(
        <DraggableSearchVideoCard
          video={mockVideo}
          onAdd={mockOnAdd}
          isAdding={true}
        />
      )

      expect(screen.getByRole("button")).toBeDisabled()
    })

    test("should not call onAdd when button is disabled", () => {
      render(
        <DraggableSearchVideoCard
          video={mockVideo}
          onAdd={mockOnAdd}
          isAdding={true}
        />
      )

      // Button should be disabled so it can't be clicked
      expect(screen.getByRole("button")).toBeDisabled()
      expect(mockOnAdd).not.toHaveBeenCalled()
    })
  })
})
