import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import DeletePlaylistDialog from "~/pages/authenticated/playlists/components/DeletePlaylistDialog"
import React from "react"
import { buildPlaylist, videoJson } from "../fixtures"

describe("DeletePlaylistDialog", () => {
  const onClose = vi.fn()
  const onDelete = vi.fn()

  const playlist = buildPlaylist({
    title: "Road Trip Mix",
    videos: [videoJson({ id: "video-1" }), videoJson({ id: "video-2" }), videoJson({ id: "video-3" })]
  })

  const renderDialog = (isOpen = true) =>
    render(<DeletePlaylistDialog isOpen={isOpen} playlist={playlist} onClose={onClose} onDelete={onDelete} />)

  beforeEach(() => {
    vi.clearAllMocks()
    onDelete.mockResolvedValue(undefined)
  })

  test("should render the playlist title and video count when open", () => {
    renderDialog()

    expect(screen.getByText("Delete Playlist?")).toBeInTheDocument()
    expect(screen.getByText("Road Trip Mix")).toBeInTheDocument()
    expect(screen.getByText(/3 videos/)).toBeInTheDocument()
  })

  test("should pluralise the video count correctly for a single video", () => {
    render(
      <DeletePlaylistDialog
        isOpen={true}
        playlist={buildPlaylist({ videos: [videoJson({ id: "video-1" })] })}
        onClose={onClose}
        onDelete={onDelete}
      />
    )

    expect(screen.getByText(/1 video\b/)).toBeInTheDocument()
  })

  test("should not render when closed", () => {
    renderDialog(false)

    expect(screen.queryByText("Delete Playlist?")).not.toBeInTheDocument()
  })

  test("should call onClose and not onDelete when cancel is clicked", () => {
    renderDialog()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onDelete).not.toHaveBeenCalled()
  })

  test("should call onDelete when delete is clicked", async () => {
    renderDialog()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledTimes(1)
    })
  })

  test("should disable both buttons while the deletion is in flight", async () => {
    let resolveDelete: () => void = () => {}
    onDelete.mockReturnValue(new Promise<void>(resolve => { resolveDelete = resolve }))

    renderDialog()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    })

    resolveDelete()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Delete" })).not.toBeDisabled()
    })
  })

  test("should close the dialog after a failed deletion so the page can report it", async () => {
    onDelete.mockRejectedValue(new Error("boom"))

    renderDialog()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(screen.getByRole("button", { name: "Delete" })).not.toBeDisabled()
    })
  })
})
