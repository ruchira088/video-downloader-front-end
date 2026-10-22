import React from "react"
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { usePlaylistEdits } from "~/pages/authenticated/playlists/usePlaylistEdits"
import type { Playlist } from "~/models/Playlist"
import {
  fetchPlaylistById,
  updatePlaylist,
  removeVideoFromPlaylist,
  reorderPlaylistVideos,
  addVideoToPlaylist,
  uploadAlbumArt,
  removeAlbumArt
} from "~/services/playlist/PlaylistService"
import { buildPlaylist, buildVideo, fileResourceJson, videoJson } from "../fixtures"
import { withNotifications } from "../helpers"

vi.mock("~/services/playlist/PlaylistService", () => ({
  fetchPlaylistById: vi.fn(),
  updatePlaylist: vi.fn(),
  removeVideoFromPlaylist: vi.fn(),
  reorderPlaylistVideos: vi.fn(),
  addVideoToPlaylist: vi.fn(),
  uploadAlbumArt: vi.fn(),
  removeAlbumArt: vi.fn()
}))

const mockFetchPlaylistById = vi.mocked(fetchPlaylistById)
const mockUpdatePlaylist = vi.mocked(updatePlaylist)
const mockRemoveVideoFromPlaylist = vi.mocked(removeVideoFromPlaylist)
const mockReorderPlaylistVideos = vi.mocked(reorderPlaylistVideos)
const mockAddVideoToPlaylist = vi.mocked(addVideoToPlaylist)
const mockUploadAlbumArt = vi.mocked(uploadAlbumArt)
const mockRemoveAlbumArt = vi.mocked(removeAlbumArt)

const PLAYLIST_ID = "playlist-123"

const video = (id: string) => buildVideo({ id, videoMetadata: { id } })

const playlistOf = (...ids: string[]): Playlist =>
  buildPlaylist({ id: PLAYLIST_ID, title: "Mix", videos: ids.map(id => videoJson({ id, videoMetadata: { id } })) })

const withVideos = (playlist: Playlist, ...ids: string[]): Playlist => ({ ...playlist, videos: ids.map(video) })

const albumArt = () => buildPlaylist({ albumArt: fileResourceJson({ id: "album-art-1" }) }).albumArt

const notFoundError = () =>
  Object.assign(new Error("Not found"), { isAxiosError: true, response: { status: 404 } })

const deferred = <A,>() => {
  let resolve: (value: A) => void = () => {}
  let reject: (error: unknown) => void = () => {}
  const promise = new Promise<A>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const notifyError = vi.fn()

const renderEdits = () =>
  renderHook(() => usePlaylistEdits(PLAYLIST_ID), {
    wrapper: ({ children }) => withNotifications(<>{children}</>, { notifyError })
  })

/** Renders the hook and waits for `playlist` to load. */
const renderLoaded = async (playlist: Playlist) => {
  mockFetchPlaylistById.mockResolvedValueOnce(playlist)
  const rendered = renderEdits()
  await waitFor(() => expect(rendered.result.current.isLoading).toBe(false))
  return rendered
}

const videoIds = (current: { playlist: { toNullable: () => Playlist | null } }) =>
  current.playlist.toNullable()?.videos.map(v => v.videoMetadata.id)

describe("usePlaylistEdits", () => {
  beforeEach(() => {
    mockFetchPlaylistById.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("loading", () => {
    test("should load the playlist by id", async () => {
      const playlist = playlistOf("a", "b")
      mockFetchPlaylistById.mockResolvedValueOnce(playlist)

      const { result } = renderEdits()

      expect(result.current.isLoading).toBe(true)
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(mockFetchPlaylistById).toHaveBeenCalledWith(PLAYLIST_ID)
      expect(result.current.playlist.toNullable()).toEqual(playlist)
      expect(result.current.loadFailure.isEmpty()).toBe(true)
    })

    test("should report a 404 as not found without notifying", async () => {
      mockFetchPlaylistById.mockRejectedValueOnce(notFoundError())

      const { result } = renderEdits()

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.loadFailure.toNullable()).toBe("not-found")
      expect(result.current.playlist.isEmpty()).toBe(true)
      expect(notifyError).not.toHaveBeenCalled()
    })

    test("should report any other failure as an error, notify, and recover on retry", async () => {
      const failure = new Error("Network down")
      mockFetchPlaylistById.mockRejectedValueOnce(failure)

      const { result } = renderEdits()

      await waitFor(() => expect(result.current.loadFailure.toNullable()).toBe("error"))
      expect(notifyError).toHaveBeenCalledWith("Failed to load the playlist", failure)

      mockFetchPlaylistById.mockResolvedValueOnce(playlistOf("a"))
      await act(() => result.current.loadPlaylist())

      expect(result.current.loadFailure.isEmpty()).toBe(true)
      expect(videoIds(result.current)).toEqual(["a"])
    })

    test("should resolve changes made before the playlist loads without calling the server", async () => {
      mockFetchPlaylistById.mockRejectedValueOnce(notFoundError())

      const { result } = renderEdits()
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect((await result.current.addVideo("a")).isEmpty()).toBe(true)
      await expect(result.current.removeVideo("a")).resolves.toBe(false)
      await expect(result.current.updateTitle("New")).resolves.toBeUndefined()

      expect(mockAddVideoToPlaylist).not.toHaveBeenCalled()
      expect(mockRemoveVideoFromPlaylist).not.toHaveBeenCalled()
      expect(mockUpdatePlaylist).not.toHaveBeenCalled()
    })
  })

  describe("updateTitle", () => {
    test("should rename the playlist", async () => {
      const playlist = playlistOf("a")
      mockUpdatePlaylist.mockResolvedValueOnce({ ...playlist, title: "Renamed" })
      const { result } = await renderLoaded(playlist)

      await act(() => result.current.updateTitle("Renamed"))

      expect(mockUpdatePlaylist).toHaveBeenCalledWith(PLAYLIST_ID, { title: "Renamed" })
      expect(result.current.playlist.map(p => p.title).toNullable()).toBe("Renamed")
    })

    test("should keep the old title and notify when the rename fails", async () => {
      const failure = new Error("Rename failed")
      mockUpdatePlaylist.mockRejectedValueOnce(failure)
      const { result } = await renderLoaded(playlistOf("a"))

      await act(() => result.current.updateTitle("Renamed"))

      expect(result.current.playlist.map(p => p.title).toNullable()).toBe("Mix")
      expect(notifyError).toHaveBeenCalledWith("Failed to rename the playlist", failure)
    })
  })

  describe("addVideo", () => {
    test("should resolve with the added video and show the server's playlist", async () => {
      const playlist = playlistOf("a")
      mockAddVideoToPlaylist.mockResolvedValueOnce(withVideos(playlist, "a", "b"))
      const { result } = await renderLoaded(playlist)

      let added = await act(() => result.current.addVideo("b"))

      expect(mockAddVideoToPlaylist).toHaveBeenCalledWith(playlist, "b")
      expect(added.map(v => v.videoMetadata.id).toNullable()).toBe("b")
      expect(videoIds(result.current)).toEqual(["a", "b"])

      // A response that, oddly, lacks the video still applies, but reports nothing added.
      mockAddVideoToPlaylist.mockResolvedValueOnce(withVideos(playlist, "a", "b"))
      added = await act(() => result.current.addVideo("c"))
      expect(added.isEmpty()).toBe(true)
    })

    test("should resolve with None and notify when the add fails", async () => {
      const failure = new Error("Add failed")
      mockAddVideoToPlaylist.mockRejectedValueOnce(failure)
      const { result } = await renderLoaded(playlistOf("a"))

      const added = await act(() => result.current.addVideo("b"))

      expect(added.isEmpty()).toBe(true)
      expect(videoIds(result.current)).toEqual(["a"])
      expect(notifyError).toHaveBeenCalledWith("Failed to add the video to the playlist", failure)
    })
  })

  describe("removeVideo", () => {
    test("should resolve true and show the server's playlist", async () => {
      const playlist = playlistOf("a", "b")
      mockRemoveVideoFromPlaylist.mockResolvedValueOnce(withVideos(playlist, "b"))
      const { result } = await renderLoaded(playlist)

      const removed = await act(() => result.current.removeVideo("a"))

      expect(mockRemoveVideoFromPlaylist).toHaveBeenCalledWith(playlist, "a")
      expect(removed).toBe(true)
      expect(videoIds(result.current)).toEqual(["b"])
    })

    test("should resolve false, keep the video and notify when the removal fails", async () => {
      const failure = new Error("Remove failed")
      mockRemoveVideoFromPlaylist.mockRejectedValueOnce(failure)
      const { result } = await renderLoaded(playlistOf("a", "b"))

      const removed = await act(() => result.current.removeVideo("a"))

      expect(removed).toBe(false)
      expect(videoIds(result.current)).toEqual(["a", "b"])
      expect(notifyError).toHaveBeenCalledWith("Failed to remove the video from the playlist", failure)
    })
  })

  describe("album art", () => {
    test("should replace and then clear the album art", async () => {
      const playlist = playlistOf("a")
      const file = new File(["bytes"], "art.jpg", { type: "image/jpeg" })
      mockUploadAlbumArt.mockResolvedValueOnce({ ...playlist, albumArt: albumArt() })
      mockRemoveAlbumArt.mockResolvedValueOnce(playlist)
      const { result } = await renderLoaded(playlist)

      await act(() => result.current.replaceAlbumArt(file))

      expect(mockUploadAlbumArt).toHaveBeenCalledWith(PLAYLIST_ID, file)
      expect(result.current.playlist.flatMap(p => p.albumArt).isEmpty()).toBe(false)

      await act(() => result.current.clearAlbumArt())

      expect(mockRemoveAlbumArt).toHaveBeenCalledWith(PLAYLIST_ID)
      expect(result.current.playlist.flatMap(p => p.albumArt).isEmpty()).toBe(true)
    })

    test("should notify when uploading or removing the album art fails", async () => {
      const uploadFailure = new Error("Upload failed")
      const removeFailure = new Error("Remove failed")
      mockUploadAlbumArt.mockRejectedValueOnce(uploadFailure)
      mockRemoveAlbumArt.mockRejectedValueOnce(removeFailure)
      const { result } = await renderLoaded(playlistOf("a"))

      await act(() => result.current.replaceAlbumArt(new File(["bytes"], "art.jpg")))
      await act(() => result.current.clearAlbumArt())

      expect(notifyError).toHaveBeenCalledWith("Failed to upload the album art", uploadFailure)
      expect(notifyError).toHaveBeenCalledWith("Failed to remove the album art", removeFailure)
    })
  })

  describe("moveVideo", () => {
    test("should show the move at once and then the order the server confirms", async () => {
      const playlist = playlistOf("a", "b", "c")
      const reorder = deferred<Playlist>()
      mockReorderPlaylistVideos.mockImplementationOnce(() => reorder.promise)
      const { result } = await renderLoaded(playlist)

      let move: Promise<void> = Promise.resolve()
      act(() => {
        move = result.current.moveVideo("a", "c")
      })

      expect(videoIds(result.current)).toEqual(["b", "c", "a"])
      await waitFor(() => expect(mockReorderPlaylistVideos).toHaveBeenCalledWith(PLAYLIST_ID, ["b", "c", "a"]))

      await act(async () => {
        reorder.resolve(withVideos(playlist, "b", "c", "a"))
        await move
      })
      expect(videoIds(result.current)).toEqual(["b", "c", "a"])
    })

    test("should do nothing for a drop onto itself or onto an unknown video", async () => {
      const { result } = await renderLoaded(playlistOf("a", "b"))

      await act(() => result.current.moveVideo("a", "a"))
      await act(() => result.current.moveVideo("a", "unknown"))

      expect(mockReorderPlaylistVideos).not.toHaveBeenCalled()
      expect(videoIds(result.current)).toEqual(["a", "b"])
    })

    test("should notify and show the refetched order when the reorder fails", async () => {
      const failure = new Error("Reorder failed")
      const playlist = playlistOf("a", "b", "c")
      mockReorderPlaylistVideos.mockRejectedValueOnce(failure)
      const { result } = await renderLoaded(playlist)
      // Someone else reordered meanwhile; the refetch is what the server now holds.
      mockFetchPlaylistById.mockResolvedValueOnce(withVideos(playlist, "c", "b", "a"))

      await act(() => result.current.moveVideo("a", "b"))

      expect(notifyError).toHaveBeenCalledWith("Failed to reorder the playlist", failure)
      expect(mockFetchPlaylistById).toHaveBeenCalledTimes(2)
      expect(result.current.isLoading).toBe(false)
      expect(videoIds(result.current)).toEqual(["c", "b", "a"])
    })

    test("should revert to the confirmed order when the refetch fails too", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const refetchFailure = new Error("Refetch failed")
      mockReorderPlaylistVideos.mockRejectedValueOnce(new Error("Reorder failed"))
      const { result } = await renderLoaded(playlistOf("a", "b", "c"))
      mockFetchPlaylistById.mockRejectedValueOnce(refetchFailure)

      await act(() => result.current.moveVideo("a", "c"))

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to refresh the playlist", refetchFailure)
      expect(videoIds(result.current)).toEqual(["a", "b", "c"])
    })

    test("should keep a queued move on screen when an earlier change lands", async () => {
      const playlist = playlistOf("a", "b", "c")
      const remove = deferred<Playlist>()
      mockRemoveVideoFromPlaylist.mockImplementationOnce(() => remove.promise)
      mockReorderPlaylistVideos.mockImplementationOnce(async (_id, ids) => withVideos(playlist, ...ids))
      const { result } = await renderLoaded(playlist)

      let removal: Promise<boolean> = Promise.resolve(false)
      let move: Promise<void> = Promise.resolve()
      act(() => {
        removal = result.current.removeVideo("c")
      })
      act(() => {
        move = result.current.moveVideo("b", "a")
      })
      expect(videoIds(result.current)).toEqual(["b", "a", "c"])

      await act(async () => {
        remove.resolve(withVideos(playlist, "a", "b"))
        await removal
      })
      // The removal's response predates the move, which must not snap back while it waits.
      expect(videoIds(result.current)).toEqual(["b", "a"])

      await act(() => move)
      expect(mockReorderPlaylistVideos).toHaveBeenCalledWith(PLAYLIST_ID, ["b", "a"])
      expect(videoIds(result.current)).toEqual(["b", "a"])
    })
  })

  describe("queueing", () => {
    test("should run each change on the result of the one before it", async () => {
      const playlist = playlistOf("a")
      const firstAdd = deferred<Playlist>()
      mockAddVideoToPlaylist
        .mockImplementationOnce(() => firstAdd.promise)
        .mockImplementationOnce(async (current, videoId) => withVideos(current, ...current.videos.map(v => v.videoMetadata.id), videoId))
      const { result } = await renderLoaded(playlist)

      let adds: Promise<unknown> = Promise.resolve()
      act(() => {
        adds = Promise.all([result.current.addVideo("b"), result.current.addVideo("c")])
      })

      // The second add waits for the first rather than racing it with a stale video list.
      await waitFor(() => expect(mockAddVideoToPlaylist).toHaveBeenCalledTimes(1))

      await act(async () => {
        firstAdd.resolve(withVideos(playlist, "a", "b"))
        await adds
      })

      expect(mockAddVideoToPlaylist).toHaveBeenCalledTimes(2)
      expect(mockAddVideoToPlaylist.mock.calls[1][0].videos.map(v => v.videoMetadata.id)).toEqual(["a", "b"])
      expect(videoIds(result.current)).toEqual(["a", "b", "c"])
    })

    test("should keep a rename made while an earlier change was in flight", async () => {
      const playlist = playlistOf("a")
      const add = deferred<Playlist>()
      mockAddVideoToPlaylist.mockImplementationOnce(() => add.promise)
      mockUpdatePlaylist.mockResolvedValueOnce({ ...playlist, title: "Renamed" })
      const { result } = await renderLoaded(playlist)

      let changes: Promise<unknown> = Promise.resolve()
      act(() => {
        changes = Promise.all([result.current.addVideo("b"), result.current.updateTitle("Renamed")])
      })

      // The add was answered before the rename reached the server, so it carries the old title.
      await act(async () => {
        add.resolve(withVideos(playlist, "a", "b"))
        await changes
      })

      expect(result.current.playlist.map(p => p.title).toNullable()).toBe("Renamed")
      expect(videoIds(result.current)).toEqual(["a", "b"])
    })

    test("should carry on with the next change after one fails", async () => {
      const playlist = playlistOf("a")
      mockAddVideoToPlaylist
        .mockRejectedValueOnce(new Error("Add failed"))
        .mockResolvedValueOnce(withVideos(playlist, "a", "c"))
      const { result } = await renderLoaded(playlist)

      const [first, second] = await act(() =>
        Promise.all([result.current.addVideo("b"), result.current.addVideo("c")])
      )

      expect(first.isEmpty()).toBe(true)
      expect(second.map(v => v.videoMetadata.id).toNullable()).toBe("c")
      expect(videoIds(result.current)).toEqual(["a", "c"])
    })
  })
})
