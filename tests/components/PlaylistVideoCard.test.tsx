import { describe, expect, test, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import PlaylistVideoCard from "~/pages/authenticated/playlists/components/PlaylistVideoCard"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import React from "react"
import { DndContext } from "@dnd-kit/core"
import type { Video } from "~/models/Video"
import { buildVideo } from "../fixtures"

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn(() => "https://example.com/thumb.jpg")
}))

const renderWithContext = (
  video: Video,
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
    renderWithContext(buildVideo({ title: "Test Video Title" }))

    expect(screen.getByText("Test Video Title")).toBeInTheDocument()
  })

  test("should render video site", () => {
    renderWithContext(buildVideo({ title: "Test Video Title" }))

    expect(screen.getByText("youtube")).toBeInTheDocument()
  })

  test("should render video thumbnail", () => {
    renderWithContext(buildVideo({ title: "Test Video Title" }))

    expect(screen.getByAltText("Test Video Title")).toBeInTheDocument()
  })

  test("should render duration", () => {
    renderWithContext(buildVideo({ title: "Test Video Title" }))

    expect(screen.getByText("5:30")).toBeInTheDocument()
  })

  test("should render index number", () => {
    renderWithContext(buildVideo({ title: "Test Video Title" }), { index: 2 })

    expect(screen.getByText("3")).toBeInTheDocument()
  })

  test("should call onPlay when play button is clicked", () => {
    const onPlay = vi.fn()
    renderWithContext(buildVideo({ title: "Test Video Title" }), { onPlay })

    const playButton = screen.getByTestId("PlayArrowIcon").closest("button")
    fireEvent.click(playButton!)

    expect(onPlay).toHaveBeenCalled()
  })

  test("should call onRemove when delete button is clicked", () => {
    const onRemove = vi.fn()
    renderWithContext(buildVideo({ title: "Test Video Title" }), { onRemove })

    const deleteButton = screen.getByTestId("DeleteIcon").closest("button")
    fireEvent.click(deleteButton!)

    expect(onRemove).toHaveBeenCalled()
  })
})
