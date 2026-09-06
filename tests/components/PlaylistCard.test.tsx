import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import PlaylistCard from "~/pages/authenticated/playlists/components/PlaylistCard"
import React from "react"
import { buildPlaylist, fileResourceJson, type Json, videoJson } from "../fixtures"

const createMockPlaylist = (overrides: Json = {}) =>
  buildPlaylist({
    title: "My Playlist",
    description: "A test playlist description",
    createdAt: "2023-10-15T10:30:00+00:00",
    ...overrides
  })

vi.mock("~/providers/ApplicationConfigurationProvider", () => ({
  useApplicationConfiguration: () => ({
    safeMode: false,
  }),
}))

vi.mock("~/services/asset/AssetService", () => ({
  imageUrl: vi.fn((resource) => `https://example.com/${resource.id}.jpg`),
}))

describe("PlaylistCard", () => {
  test("should render playlist title", () => {
    render(<PlaylistCard playlist={createMockPlaylist()} />)

    expect(screen.getByText("My Playlist")).toBeInTheDocument()
  })

  test("should render playlist description when provided", () => {
    render(<PlaylistCard playlist={createMockPlaylist()} />)

    expect(screen.getByText("A test playlist description")).toBeInTheDocument()
  })

  test("should not render description when not provided", () => {
    render(<PlaylistCard playlist={createMockPlaylist({ description: null })} />)

    expect(screen.queryByText("A test playlist description")).not.toBeInTheDocument()
  })

  test("should render timestamp", () => {
    render(<PlaylistCard playlist={createMockPlaylist()} />)

    expect(screen.getByText(/2023/)).toBeInTheDocument()
  })

  test("should render a placeholder icon when there is no album art", () => {
    render(<PlaylistCard playlist={createMockPlaylist()} />)

    expect(screen.getByTestId("QueueMusicIcon")).toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  test("should render the album art in place of the icon when set", () => {
    render(<PlaylistCard playlist={createMockPlaylist({ albumArt: fileResourceJson({ id: "art-1" }) })} />)

    expect(screen.getByRole("img", { name: "My Playlist cover" })).toHaveAttribute("src", "https://example.com/art-1.jpg")
    expect(screen.queryByTestId("QueueMusicIcon")).not.toBeInTheDocument()
  })

  test("should render video count", () => {
    render(<PlaylistCard playlist={createMockPlaylist({ videos: [videoJson(), videoJson(), videoJson()] })} />)

    expect(screen.getByText("3 videos")).toBeInTheDocument()
  })

  test("should render singular video for 1 video", () => {
    render(<PlaylistCard playlist={createMockPlaylist({ videos: [videoJson()] })} />)

    expect(screen.getByText("1 video")).toBeInTheDocument()
  })
})
