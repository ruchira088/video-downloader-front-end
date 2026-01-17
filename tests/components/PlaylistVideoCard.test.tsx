import { describe, expect, test, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import PlaylistVideoCard from "~/pages/authenticated/playlists/components/PlaylistVideoCard"
import { DateTime, Duration } from "luxon"
import { FileResourceType } from "~/models/FileResource"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"
import { DndContext } from "@dnd-kit/core"

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/thumb.jpg")
}))

const createMockVideo = () => ({
  videoMetadata: {
    url: "https://example.com/video",
    id: "video-123",
    videoSite: "youtube",
    title: "Test Video Title",
    duration: Duration.fromObject({ minutes: 5, seconds: 30 }),
    size: 1024000000,
    thumbnail: {
      id: "thumb-123",
      type: FileResourceType.Thumbnail as const,
      createdAt: DateTime.now(),
      path: "/path/to/thumb",
      mediaType: "image/jpeg",
      size: 1024
    }
  },
  fileResource: {
    id: "file-123",
    type: FileResourceType.Video as const,
    createdAt: DateTime.now(),
    path: "/path/to/video",
    mediaType: "video/mp4",
    size: 1024000000
  },
  createdAt: DateTime.now(),
  watchTime: Duration.fromObject({ minutes: 2 })
})

const renderWithContext = (
  video: ReturnType<typeof createMockVideo>,
  props = {}
) => {
  const contextValue = {
    safeMode: false,
    theme: Theme.Light,
    setSafeMode: vi.fn(),
    setTheme: vi.fn()
  }

  const defaultProps = {
    video,
    index: 0,
    onRemove: vi.fn(),
    onPlay: vi.fn(),
    isCurrentlyPlaying: false,
    ...props
  }

  return render(
    <DndContext>
      <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
        <PlaylistVideoCard {...defaultProps} />
      </ApplicationConfigurationContext.Provider>
    </DndContext>
  )
}

describe("PlaylistVideoCard", () => {
  test("should render video title", () => {
    renderWithContext(createMockVideo())

    expect(screen.getByText("Test Video Title")).toBeInTheDocument()
  })

  test("should render video site", () => {
    renderWithContext(createMockVideo())

    expect(screen.getByText("youtube")).toBeInTheDocument()
  })

  test("should render video thumbnail", () => {
    renderWithContext(createMockVideo())

    expect(screen.getByAltText("Test Video Title")).toBeInTheDocument()
  })

  test("should render duration", () => {
    renderWithContext(createMockVideo())

    expect(screen.getByText("5:30")).toBeInTheDocument()
  })

  test("should render index number", () => {
    renderWithContext(createMockVideo(), { index: 2 })

    expect(screen.getByText("3")).toBeInTheDocument()
  })

  test("should call onPlay when play button is clicked", () => {
    const onPlay = vi.fn()
    renderWithContext(createMockVideo(), { onPlay })

    const playButton = screen.getByTestId("PlayArrowIcon").closest("button")
    fireEvent.click(playButton!)

    expect(onPlay).toHaveBeenCalled()
  })

  test("should call onRemove when delete button is clicked", () => {
    const onRemove = vi.fn()
    renderWithContext(createMockVideo(), { onRemove })

    const deleteButton = screen.getByTestId("DeleteIcon").closest("button")
    fireEvent.click(deleteButton!)

    expect(onRemove).toHaveBeenCalled()
  })
})
