import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import CreatePlaylistDialog from "~/pages/authenticated/playlists/components/CreatePlaylistDialog"
import { DateTime } from "luxon"
import { None } from "~/types/Option"
import { FileResource, FileResourceType } from "~/models/FileResource"
import React from "react"

vi.mock("~/services/playlist/PlaylistService", () => ({
  createPlaylist: vi.fn()
}))

const createMockPlaylist = () => ({
  id: "playlist-123",
  userId: "user-123",
  title: "Test Playlist",
  description: "Test Description",
  createdAt: DateTime.now(),
  videos: [],
  albumArt: None.of<FileResource<FileResourceType.AlbumArt>>()
})

describe("CreatePlaylistDialog", () => {
  const onClose = vi.fn()
  const onPlaylistCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render dialog when open", () => {
    render(
      <CreatePlaylistDialog
        isOpen={true}
        onClose={onClose}
        onPlaylistCreated={onPlaylistCreated}
      />
    )

    expect(screen.getByText("Create New Playlist")).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Description (optional)")).toBeInTheDocument()
  })

  test("should not render dialog when closed", () => {
    render(
      <CreatePlaylistDialog
        isOpen={false}
        onClose={onClose}
        onPlaylistCreated={onPlaylistCreated}
      />
    )

    expect(screen.queryByText("Create New Playlist")).not.toBeInTheDocument()
  })

  test("should update name input value on change", () => {
    render(
      <CreatePlaylistDialog
        isOpen={true}
        onClose={onClose}
        onPlaylistCreated={onPlaylistCreated}
      />
    )

    const nameInput = screen.getByLabelText("Name")
    fireEvent.change(nameInput, { target: { value: "My New Playlist" } })

    expect(nameInput).toHaveValue("My New Playlist")
  })

  test("should disable create button when name is empty", () => {
    render(
      <CreatePlaylistDialog
        isOpen={true}
        onClose={onClose}
        onPlaylistCreated={onPlaylistCreated}
      />
    )

    const createButton = screen.getByRole("button", { name: "Create" })
    expect(createButton).toBeDisabled()
  })

  test("should enable create button when name is provided", () => {
    render(
      <CreatePlaylistDialog
        isOpen={true}
        onClose={onClose}
        onPlaylistCreated={onPlaylistCreated}
      />
    )

    const nameInput = screen.getByLabelText("Name")
    fireEvent.change(nameInput, { target: { value: "My New Playlist" } })

    const createButton = screen.getByRole("button", { name: "Create" })
    expect(createButton).not.toBeDisabled()
  })

  test("should call onClose when cancel button is clicked", () => {
    render(
      <CreatePlaylistDialog
        isOpen={true}
        onClose={onClose}
        onPlaylistCreated={onPlaylistCreated}
      />
    )

    const cancelButton = screen.getByRole("button", { name: "Cancel" })
    fireEvent.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  test("should call createPlaylist and onPlaylistCreated when create button is clicked", async () => {
    const { createPlaylist } = await import("~/services/playlist/PlaylistService")
    vi.mocked(createPlaylist).mockResolvedValue(createMockPlaylist())

    render(
      <CreatePlaylistDialog
        isOpen={true}
        onClose={onClose}
        onPlaylistCreated={onPlaylistCreated}
      />
    )

    const nameInput = screen.getByLabelText("Name")
    fireEvent.change(nameInput, { target: { value: "Test Playlist" } })

    const createButton = screen.getByRole("button", { name: "Create" })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(createPlaylist).toHaveBeenCalledWith("Test Playlist", undefined)
    })

    await waitFor(() => {
      expect(onPlaylistCreated).toHaveBeenCalled()
    })
  })
})
