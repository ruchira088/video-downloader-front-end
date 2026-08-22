import { describe, expect, test, vi, beforeEach } from "vitest"

vi.mock("~/services/http/HttpClient", () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

import { axiosClient } from "~/services/http/HttpClient"
import {
  createPlaylist,
  fetchPlaylists,
  fetchPlaylistById,
  updatePlaylist,
  deletePlaylist,
  reorderPlaylistVideos,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  uploadAlbumArt,
  removeAlbumArt
} from "~/services/playlist/PlaylistService"
import { PlaylistSortBy } from "~/models/PlaylistSortBy"
import { PlaylistOrdering } from "~/models/PlaylistOrdering"
import { None } from "~/types/Option"
import { buildPlaylist, fileResourceJson, playlistJson, videoJson } from "../fixtures"

const mockAxiosGet = vi.mocked(axiosClient.get)
const mockAxiosPost = vi.mocked(axiosClient.post)
const mockAxiosPut = vi.mocked(axiosClient.put)
const mockAxiosDelete = vi.mocked(axiosClient.delete)

describe("PlaylistService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createPlaylist", () => {
    test("should call API with title and description", async () => {
      const mockPlaylist = playlistJson({ id: "1", title: "My Playlist" })
      mockAxiosPost.mockResolvedValue({ data: mockPlaylist })

      await createPlaylist("My Playlist", "Description")

      expect(mockAxiosPost).toHaveBeenCalledWith("/playlists", {
        title: "My Playlist",
        description: "Description"
      })
    })

    test("should return parsed playlist", async () => {
      const mockPlaylist = playlistJson({ id: "1", title: "My Playlist" })
      mockAxiosPost.mockResolvedValue({ data: mockPlaylist })

      const result = await createPlaylist("My Playlist")

      expect(result.id).toBe("1")
      expect(result.title).toBe("My Playlist")
    })
  })

  describe("fetchPlaylists", () => {
    test("should call API with pagination parameters", async () => {
      mockAxiosGet.mockResolvedValue({ data: { results: [] } })

      await fetchPlaylists(None.of(), 0, 20, PlaylistSortBy.CreatedAt, PlaylistOrdering.Descending)

      expect(mockAxiosGet).toHaveBeenCalledWith("/playlists", {
        params: {
          searchTerm: null,
          pageNumber: 0,
          pageSize: 20,
          sortBy: PlaylistSortBy.CreatedAt,
          order: PlaylistOrdering.Descending
        }
      })
    })

    test("should return parsed playlists array", async () => {
      const mockPlaylists = {
        results: [
          playlistJson({ id: "1", title: "Playlist 1" }),
          playlistJson({ id: "2", title: "Playlist 2" })
        ]
      }
      mockAxiosGet.mockResolvedValue({ data: mockPlaylists })

      const result = await fetchPlaylists(None.of(), 0, 20, PlaylistSortBy.CreatedAt, PlaylistOrdering.Descending)

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe("Playlist 1")
    })
  })

  describe("fetchPlaylistById", () => {
    test("should call API with playlist ID", async () => {
      const mockPlaylist = playlistJson({ id: "123", title: "My Playlist" })
      mockAxiosGet.mockResolvedValue({ data: mockPlaylist })

      await fetchPlaylistById("123")

      expect(mockAxiosGet).toHaveBeenCalledWith("/playlists/id/123")
    })

    test("should return playlist with videos", async () => {
      const mockPlaylist = playlistJson({ id: "123", title: "My Playlist", videos: [
        videoJson({ id: "video-1", title: "Video 1" })
      ] })
      mockAxiosGet.mockResolvedValue({ data: mockPlaylist })

      const result = await fetchPlaylistById("123")

      expect(result.id).toBe("123")
      expect(result.videos).toHaveLength(1)
    })
  })

  describe("updatePlaylist", () => {
    test("should call API with update data", async () => {
      const mockPlaylist = playlistJson({ id: "123", title: "Updated Title" })
      mockAxiosPut.mockResolvedValue({ data: mockPlaylist })

      await updatePlaylist("123", "Updated Title", "Updated Description")

      expect(mockAxiosPut).toHaveBeenCalledWith("/playlists/id/123", {
        title: "Updated Title",
        description: "Updated Description",
        videoIds: undefined
      })
    })
  })

  describe("deletePlaylist", () => {
    test("should call API to delete playlist", async () => {
      const mockPlaylist = playlistJson({ id: "123", title: "My Playlist" })
      mockAxiosDelete.mockResolvedValue({ data: mockPlaylist })

      await deletePlaylist("123")

      expect(mockAxiosDelete).toHaveBeenCalledWith("/playlists/id/123")
    })
  })

  describe("reorderPlaylistVideos", () => {
    test("should call API with new video order", async () => {
      const mockPlaylist = playlistJson({ id: "playlist-123", title: "My Playlist", videos: [
        videoJson({ id: "video-2", title: "Video 2" }),
        videoJson({ id: "video-1", title: "Video 1" })
      ] })
      mockAxiosPut.mockResolvedValue({ data: mockPlaylist })

      await reorderPlaylistVideos("playlist-123", ["video-2", "video-1"])

      expect(mockAxiosPut).toHaveBeenCalledWith("/playlists/id/playlist-123", {
        title: undefined,
        description: undefined,
        videoIds: ["video-2", "video-1"]
      })
    })
  })

  describe("addVideoToPlaylist", () => {
    test("should append the video to the existing ordering", async () => {
      const existingPlaylist = buildPlaylist({
        id: "playlist-123",
        videos: [videoJson({ id: "video-1", title: "Video 1" })]
      })
      mockAxiosPut.mockResolvedValue({ data: playlistJson({ id: "playlist-123" }) })

      await addVideoToPlaylist(existingPlaylist, "video-2")

      expect(mockAxiosPut).toHaveBeenCalledWith("/playlists/id/playlist-123", {
        title: undefined,
        description: undefined,
        videoIds: ["video-1", "video-2"]
      })
    })

    test("should add a video to an empty playlist", async () => {
      const existingPlaylist = buildPlaylist({ id: "playlist-123", videos: [] })
      mockAxiosPut.mockResolvedValue({ data: playlistJson({ id: "playlist-123" }) })

      await addVideoToPlaylist(existingPlaylist, "video-1")

      expect(mockAxiosPut).toHaveBeenCalledWith("/playlists/id/playlist-123", {
        title: undefined,
        description: undefined,
        videoIds: ["video-1"]
      })
    })
  })

  describe("removeVideoFromPlaylist", () => {
    test("should drop the video and keep the remaining ordering", async () => {
      const existingPlaylist = buildPlaylist({
        id: "playlist-123",
        videos: [
          videoJson({ id: "video-1", title: "Video 1" }),
          videoJson({ id: "video-2", title: "Video 2" })
        ]
      })
      mockAxiosPut.mockResolvedValue({ data: playlistJson({ id: "playlist-123" }) })

      await removeVideoFromPlaylist(existingPlaylist, "video-1")

      expect(mockAxiosPut).toHaveBeenCalledWith("/playlists/id/playlist-123", {
        title: undefined,
        description: undefined,
        videoIds: ["video-2"]
      })
    })

    test("should send an empty ordering when the last video is removed", async () => {
      const existingPlaylist = buildPlaylist({
        id: "playlist-123",
        videos: [videoJson({ id: "video-1", title: "Video 1" })]
      })
      mockAxiosPut.mockResolvedValue({ data: playlistJson({ id: "playlist-123" }) })

      await removeVideoFromPlaylist(existingPlaylist, "video-1")

      expect(mockAxiosPut).toHaveBeenCalledWith("/playlists/id/playlist-123", {
        title: undefined,
        description: undefined,
        videoIds: []
      })
    })
  })

  describe("uploadAlbumArt", () => {
    test("should PUT the file as multipart form data", async () => {
      mockAxiosPut.mockResolvedValue({ data: playlistJson({ id: "123", title: "My Playlist" }) })

      const file = new File(["cover-bytes"], "cover.jpg", { type: "image/jpeg" })
      await uploadAlbumArt("123", file)

      expect(mockAxiosPut).toHaveBeenCalledWith("/playlists/id/123/album-art", expect.any(FormData))

      // The API reads the upload from a "file" part, so the field name is part of the contract.
      const formData = mockAxiosPut.mock.calls[0][1] as FormData
      expect(formData.get("file")).toBe(file)
    })

    test("should return the parsed playlist carrying the new album art", async () => {
      mockAxiosPut.mockResolvedValue({
        data: {
          ...playlistJson({ id: "123", title: "My Playlist" }),
          albumArt: { ...fileResourceJson({ id: "art-1" }), type: "album-art" }
        }
      })

      const result = await uploadAlbumArt("123", new File([""], "cover.jpg"))

      expect(result.albumArt.isEmpty()).toBe(false)
      expect(result.albumArt.toNullable()?.id).toBe("art-1")
    })
  })

  describe("removeAlbumArt", () => {
    test("should DELETE the album art and return the playlist without it", async () => {
      mockAxiosDelete.mockResolvedValue({ data: playlistJson({ id: "123", title: "My Playlist" }) })

      const result = await removeAlbumArt("123")

      expect(mockAxiosDelete).toHaveBeenCalledWith("/playlists/id/123/album-art")
      expect(result.albumArt.isEmpty()).toBe(true)
    })
  })

  describe("failure handling", () => {
    test("should propagate transport errors rather than swallowing them", async () => {
      mockAxiosGet.mockRejectedValue(new Error("Network Error"))

      await expect(fetchPlaylistById("123")).rejects.toThrow("Network Error")
    })

    test("should reject when the API returns a playlist that fails validation", async () => {
      // A drifting API contract must fail loudly at the boundary instead of leaking
      // a half-built Playlist into the UI.
      mockAxiosGet.mockResolvedValue({ data: { id: "123", title: "My Playlist" } })

      await expect(fetchPlaylistById("123")).rejects.toThrow()
    })

    test("should reject when a playlist in a list response fails validation", async () => {
      mockAxiosGet.mockResolvedValue({ data: { results: [{ id: "1" }] } })

      await expect(
        fetchPlaylists(None.of(), 0, 20, PlaylistSortBy.CreatedAt, PlaylistOrdering.Descending)
      ).rejects.toThrow()
    })

    test("should reject when createdAt is not a valid date-time", async () => {
      mockAxiosPost.mockResolvedValue({
        data: { ...playlistJson({ id: "1", title: "My Playlist" }), createdAt: "not-a-date" }
      })

      await expect(createPlaylist("My Playlist")).rejects.toThrow()
    })
  })
})
