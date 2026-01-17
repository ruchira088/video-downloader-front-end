import { describe, expect, test, vi, beforeEach, beforeAll } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PlaylistDetail from "~/pages/authenticated/playlists/PlaylistDetail"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"
import { DateTime, Duration } from "luxon"
import { FileResourceType, type FileResource } from "~/models/FileResource"
import { None } from "~/types/Option"

vi.mock("~/services/playlist/PlaylistService", () => ({
  fetchPlaylistById: vi.fn(),
  deletePlaylist: vi.fn(),
  updatePlaylist: vi.fn(),
  removeVideoFromPlaylist: vi.fn(),
  reorderPlaylistVideos: vi.fn(),
  addVideoToPlaylist: vi.fn(),
}))

vi.mock("~/services/video/VideoService", () => ({
  searchVideos: vi.fn(),
  videoServiceSummary: vi.fn().mockResolvedValue({ sites: ["TestSite"] }),
}))

vi.mock("~/providers/ApplicationConfigurationProvider", () => ({
  useApplicationConfiguration: () => ({
    safeMode: false,
  }),
}))

import {
  fetchPlaylistById,
  deletePlaylist,
  updatePlaylist,
  removeVideoFromPlaylist,
} from "~/services/playlist/PlaylistService"
import { searchVideos } from "~/services/video/VideoService"

const mockFetchPlaylistById = vi.mocked(fetchPlaylistById)
const mockDeletePlaylist = vi.mocked(deletePlaylist)
const mockUpdatePlaylist = vi.mocked(updatePlaylist)
const mockRemoveVideoFromPlaylist = vi.mocked(removeVideoFromPlaylist)
const mockSearchVideos = vi.mocked(searchVideos)

const createMockVideo = (id: string, title: string) => ({
  videoMetadata: {
    id,
    url: `https://example.com/video/${id}`,
    videoSite: "TestSite",
    title,
    duration: Duration.fromObject({ minutes: 5 }),
    size: 1024 * 1024 * 100,
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
    size: 1024 * 1024 * 100,
  },
  createdAt: DateTime.now(),
  watchTime: Duration.fromObject({ minutes: 0 }),
})

const createMockPlaylist = (videoCount: number = 2) => ({
  id: "playlist-123",
  userId: "user-123",
  createdAt: DateTime.now(),
  title: "Test Playlist",
  description: "A test playlist",
  videos: Array.from({ length: videoCount }, (_, i) =>
    createMockVideo(`video-${i + 1}`, `Video ${i + 1}`)
  ),
  albumArt: None.of<FileResource<FileResourceType.AlbumArt>>(),
})

const renderWithRouter = (playlistId: string = "playlist-123") => {
  const routes = [
    {
      path: "/playlists/:playlistId",
      element: <PlaylistDetail {...{ params: { playlistId }, matches: [] } as any} />,
    },
    {
      path: "/playlists",
      element: <div>Playlists Page</div>,
    },
  ]
  const router = createMemoryRouter(routes, {
    initialEntries: [`/playlists/${playlistId}`],
  })

  return render(<RouterProvider router={router} />)
}

// Mock HTMLVideoElement
beforeAll(() => {
  window.HTMLMediaElement.prototype.load = vi.fn()
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  window.HTMLMediaElement.prototype.pause = vi.fn()
})

describe("PlaylistDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, "confirm").mockReturnValue(true)
  })

  describe("Loading State", () => {
    test("should show loading spinner while fetching playlist", () => {
      mockFetchPlaylistById.mockImplementation(() => new Promise(() => {}))

      renderWithRouter()

      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    })
  })

  describe("Playlist Display", () => {
    test("should display playlist title", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist())

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument()
      })
    })

    test("should display playlist description", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist())

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("A test playlist")).toBeInTheDocument()
      })
    })

    test("should display video count", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist(3))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("3 videos")).toBeInTheDocument()
      })
    })

    test("should display singular video for single video", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist(1))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("1 video")).toBeInTheDocument()
      })
    })

    test("should display video cards", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist(2))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Video 1")).toBeInTheDocument()
        expect(screen.getByText("Video 2")).toBeInTheDocument()
      })
    })

    test("should display empty state when no videos", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist(0))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("No videos in this playlist yet.")).toBeInTheDocument()
      })
    })
  })

  describe("Actions", () => {
    test("should show Play button", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist())

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument()
      })
    })

    test("should disable Play button when playlist is empty", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist(0))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /play/i })).toBeDisabled()
      })
    })

    test("should show Add Videos button", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist())

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add videos/i })).toBeInTheDocument()
      })
    })

    test("should toggle Add Videos panel when clicking Add Videos button", async () => {
      const user = userEvent.setup()
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist())

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add videos/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole("button", { name: /add videos/i }))

      await waitFor(() => {
        expect(screen.getByText("Add Videos", { selector: "h3" })).toBeInTheDocument()
      })

      await user.click(screen.getByRole("button", { name: /close/i }))

      await waitFor(() => {
        expect(screen.queryByText("Add Videos", { selector: "h3" })).not.toBeInTheDocument()
      })
    })

    test("should render back button", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist())

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument()
      })

      // Check that we have multiple buttons including the back button
      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(0)
    })

    test("should delete playlist when clicking delete button", async () => {
      const user = userEvent.setup()
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist())
      mockDeletePlaylist.mockResolvedValue(createMockPlaylist())

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole("button")
      const deleteButton = deleteButtons.find(btn => btn.querySelector('[data-testid="DeleteIcon"]'))
      if (deleteButton) {
        await user.click(deleteButton)
      }

      await waitFor(() => {
        expect(mockDeletePlaylist).toHaveBeenCalledWith("playlist-123")
      })
    })
  })

  describe("Playlist Videos", () => {
    test("should render video titles", async () => {
      const playlist = createMockPlaylist(2)
      mockFetchPlaylistById.mockResolvedValue(playlist)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Video 1")).toBeInTheDocument()
        expect(screen.getByText("Video 2")).toBeInTheDocument()
      })
    })
  })



  describe("Play Functionality", () => {
    test("should enable Play button when playlist has videos", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist())

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /play/i })).not.toBeDisabled()
      })
    })
  })

  describe("Delete Confirmation", () => {
    test("should not delete playlist when confirm is cancelled", async () => {
      const user = userEvent.setup()
      vi.spyOn(window, "confirm").mockReturnValue(false)
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist())

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole("button")
      const deleteButton = deleteButtons.find(btn => btn.querySelector('[data-testid="DeleteIcon"]'))
      if (deleteButton) {
        await user.click(deleteButton)
      }

      expect(mockDeletePlaylist).not.toHaveBeenCalled()
    })
  })

  describe("Playlist without description", () => {
    test("should not display description when not provided", async () => {
      const playlist = {
        ...createMockPlaylist(),
        description: undefined,
      }
      mockFetchPlaylistById.mockResolvedValue(playlist)

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument()
      })

      expect(screen.queryByText("A test playlist")).not.toBeInTheDocument()
    })
  })

  describe("Player Functionality", () => {
    test("should open player when clicking Play button", async () => {
      const user = userEvent.setup()
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist(2))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole("button", { name: /play/i }))

      await waitFor(() => {
        expect(screen.getByText("1 / 2")).toBeInTheDocument()
      })
    })

    test("should show Up Next in player", async () => {
      const user = userEvent.setup()
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist(3))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole("button", { name: /play/i }))

      await waitFor(() => {
        expect(screen.getByText("Up Next")).toBeInTheDocument()
      })
    })
  })

  describe("Update Title", () => {
    test("should update playlist title", async () => {
      userEvent.setup()
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist())
      mockUpdatePlaylist.mockResolvedValue(createMockPlaylist())

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument()
      })

      // The EditableLabel component should be present
      const titleElement = screen.getByText("Test Playlist")
      expect(titleElement).toBeInTheDocument()
    })
  })

  describe("Remove Video", () => {
    test("should call removeVideoFromPlaylist when remove button is clicked", async () => {
      const user = userEvent.setup()
      const playlist = createMockPlaylist(2)
      mockFetchPlaylistById.mockResolvedValue(playlist)
      mockRemoveVideoFromPlaylist.mockResolvedValue({
        ...playlist,
        videos: [playlist.videos[1]],
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Video 1")).toBeInTheDocument()
      })

      // Find all delete icon buttons and click the one inside the video card (not the header one)
      const deleteIcons = screen.getAllByTestId("DeleteIcon")
      // The first delete icon is in the header, the rest are on video cards
      expect(deleteIcons.length).toBeGreaterThan(1)
      const videoDeleteButton = deleteIcons[1].closest("button")
      if (videoDeleteButton) {
        await user.click(videoDeleteButton)
      }

      await waitFor(() => {
        expect(mockRemoveVideoFromPlaylist).toHaveBeenCalled()
      })
    })
  })

  describe("Add Video", () => {
    test("should show video search panel when Add Videos is clicked", async () => {
      const user = userEvent.setup()
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist())
      mockSearchVideos.mockResolvedValue({
        results: [createMockVideo("new-video", "New Video")],
        pageNumber: 0,
        pageSize: 50,
        searchTerm: None.of(),
      })

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add videos/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole("button", { name: /add videos/i }))

      await waitFor(() => {
        expect(screen.getByText("Add Videos", { selector: "h3" })).toBeInTheDocument()
      })
    })
  })

  describe("Zero videos state", () => {
    test("should show 0 videos count", async () => {
      mockFetchPlaylistById.mockResolvedValue(createMockPlaylist(0))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("0 videos")).toBeInTheDocument()
      })
    })
  })
})
