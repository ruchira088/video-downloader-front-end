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
  reorderPlaylistVideos
} from "~/services/playlist/PlaylistService"
import { PlaylistSortBy } from "~/models/PlaylistSortBy"
import { PlaylistOrdering } from "~/models/PlaylistOrdering"
import { None } from "~/types/Option"

const mockAxiosGet = vi.mocked(axiosClient.get)
const mockAxiosPost = vi.mocked(axiosClient.post)
const mockAxiosPut = vi.mocked(axiosClient.put)
const mockAxiosDelete = vi.mocked(axiosClient.delete)

const createMockFileResource = (id: string) => ({
  id,
  createdAt: "2024-01-15T10:00:00+00:00",
  path: `/files/${id}`,
  mediaType: "image/jpeg",
  size: 50000
})

const createMockVideo = (id: string, title: string) => ({
  videoMetadata: {
    url: `https://example.com/video/${id}`,
    id,
    videoSite: "youtube",
    title,
    duration: { length: 300, unit: "seconds" },
    size: 1000000,
    thumbnail: createMockFileResource(`thumb-${id}`)
  },
  fileResource: {
    id: `file-${id}`,
    createdAt: "2024-01-15T10:00:00+00:00",
    path: `/videos/${id}.mp4`,
    mediaType: "video/mp4",
    size: 1000000
  },
  createdAt: "2024-01-15T10:00:00+00:00",
  watchTime: { length: 0, unit: "seconds" }
})

const createMockPlaylist = (id: string, title: string, videos: unknown[] = []) => ({
  id,
  userId: "user-123",
  createdAt: "2024-01-15T10:00:00+00:00",
  title,
  description: "Test description",
  videos,
  albumArt: null
})

describe("PlaylistService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createPlaylist", () => {
    test("should call API with title and description", async () => {
      const mockPlaylist = createMockPlaylist("1", "My Playlist")
      mockAxiosPost.mockResolvedValue({ data: mockPlaylist })

      await createPlaylist("My Playlist", "Description")

      expect(mockAxiosPost).toHaveBeenCalledWith("/playlists", {
        title: "My Playlist",
        description: "Description"
      })
    })

    test("should return parsed playlist", async () => {
      const mockPlaylist = createMockPlaylist("1", "My Playlist")
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
          createMockPlaylist("1", "Playlist 1"),
          createMockPlaylist("2", "Playlist 2")
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
      const mockPlaylist = createMockPlaylist("123", "My Playlist")
      mockAxiosGet.mockResolvedValue({ data: mockPlaylist })

      await fetchPlaylistById("123")

      expect(mockAxiosGet).toHaveBeenCalledWith("/playlists/id/123")
    })

    test("should return playlist with videos", async () => {
      const mockPlaylist = createMockPlaylist("123", "My Playlist", [
        createMockVideo("video-1", "Video 1")
      ])
      mockAxiosGet.mockResolvedValue({ data: mockPlaylist })

      const result = await fetchPlaylistById("123")

      expect(result.id).toBe("123")
      expect(result.videos).toHaveLength(1)
    })
  })

  describe("updatePlaylist", () => {
    test("should call API with update data", async () => {
      const mockPlaylist = createMockPlaylist("123", "Updated Title")
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
      const mockPlaylist = createMockPlaylist("123", "My Playlist")
      mockAxiosDelete.mockResolvedValue({ data: mockPlaylist })

      await deletePlaylist("123")

      expect(mockAxiosDelete).toHaveBeenCalledWith("/playlists/id/123")
    })
  })

  describe("reorderPlaylistVideos", () => {
    test("should call API with new video order", async () => {
      const mockPlaylist = createMockPlaylist("playlist-123", "My Playlist", [
        createMockVideo("video-2", "Video 2"),
        createMockVideo("video-1", "Video 1")
      ])
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
    test("should add video to existing playlist videos", async () => {
      const existingPlaylist = {
        ...createMockPlaylist("playlist-123", "My Playlist", [
          createMockVideo("video-1", "Video 1")
        ]),
        videos: [createMockVideo("video-1", "Video 1")]
      }
      const updatedPlaylist = createMockPlaylist("playlist-123", "My Playlist", [
        createMockVideo("video-1", "Video 1"),
        createMockVideo("video-2", "Video 2")
      ])
      mockAxiosPut.mockResolvedValue({ data: updatedPlaylist })

      const { addVideoToPlaylist } = await import("~/services/playlist/PlaylistService")
      await addVideoToPlaylist(existingPlaylist as any, "video-2")

      expect(mockAxiosPut).toHaveBeenCalledWith("/playlists/id/playlist-123", {
        title: undefined,
        description: undefined,
        videoIds: ["video-1", "video-2"]
      })
    })

    test("should add video to empty playlist", async () => {
      const existingPlaylist = {
        ...createMockPlaylist("playlist-123", "My Playlist", []),
        videos: []
      }
      const updatedPlaylist = createMockPlaylist("playlist-123", "My Playlist", [
        createMockVideo("video-1", "Video 1")
      ])
      mockAxiosPut.mockResolvedValue({ data: updatedPlaylist })

      const { addVideoToPlaylist } = await import("~/services/playlist/PlaylistService")
      await addVideoToPlaylist(existingPlaylist as any, "video-1")

      expect(mockAxiosPut).toHaveBeenCalledWith("/playlists/id/playlist-123", {
        title: undefined,
        description: undefined,
        videoIds: ["video-1"]
      })
    })
  })

  describe("removeVideoFromPlaylist", () => {
    test("should remove video from playlist", async () => {
      const existingPlaylist = {
        ...createMockPlaylist("playlist-123", "My Playlist", [
          createMockVideo("video-1", "Video 1"),
          createMockVideo("video-2", "Video 2")
        ]),
        videos: [
          createMockVideo("video-1", "Video 1"),
          createMockVideo("video-2", "Video 2")
        ]
      }
      const updatedPlaylist = createMockPlaylist("playlist-123", "My Playlist", [
        createMockVideo("video-2", "Video 2")
      ])
      mockAxiosPut.mockResolvedValue({ data: updatedPlaylist })

      const { removeVideoFromPlaylist } = await import("~/services/playlist/PlaylistService")
      await removeVideoFromPlaylist(existingPlaylist as any, "video-1")

      expect(mockAxiosPut).toHaveBeenCalledWith("/playlists/id/playlist-123", {
        title: undefined,
        description: undefined,
        videoIds: ["video-2"]
      })
    })

    test("should result in empty playlist when removing last video", async () => {
      const existingPlaylist = {
        ...createMockPlaylist("playlist-123", "My Playlist", [
          createMockVideo("video-1", "Video 1")
        ]),
        videos: [createMockVideo("video-1", "Video 1")]
      }
      const updatedPlaylist = createMockPlaylist("playlist-123", "My Playlist", [])
      mockAxiosPut.mockResolvedValue({ data: updatedPlaylist })

      const { removeVideoFromPlaylist } = await import("~/services/playlist/PlaylistService")
      await removeVideoFromPlaylist(existingPlaylist as any, "video-1")

      expect(mockAxiosPut).toHaveBeenCalledWith("/playlists/id/playlist-123", {
        title: undefined,
        description: undefined,
        videoIds: []
      })
    })
  })
})
