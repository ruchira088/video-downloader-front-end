import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import PlaylistCard from "~/pages/authenticated/playlists/components/PlaylistCard"
import { DateTime } from "luxon"
import { None } from "~/types/Option"
import { FileResource, FileResourceType } from "~/models/FileResource"
import React from "react"

const createMockPlaylist = (overrides = {}) => ({
  id: "playlist-123",
  userId: "user-123",
  title: "My Playlist",
  description: "A test playlist description",
  createdAt: DateTime.fromISO("2023-10-15T10:30:00Z"),
  videos: [],
  albumArt: None.of<FileResource<FileResourceType.AlbumArt>>(),
  ...overrides
})

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

  test("should render playlist icon", () => {
    render(<PlaylistCard playlist={createMockPlaylist()} />)

    expect(screen.getByTestId("QueueMusicIcon")).toBeInTheDocument()
  })

  test("should render video count", () => {
    render(<PlaylistCard playlist={createMockPlaylist({ videos: [{}, {}, {}] })} />)

    expect(screen.getByText("3 videos")).toBeInTheDocument()
  })

  test("should render singular video for 1 video", () => {
    render(<PlaylistCard playlist={createMockPlaylist({ videos: [{}] })} />)

    expect(screen.getByText("1 video")).toBeInTheDocument()
  })
})
