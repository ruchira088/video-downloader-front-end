import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Playlists from "~/pages/authenticated/playlists/Playlists"
import { DateTime } from "luxon"
import { None } from "~/types/Option"
import { FileResource, FileResourceType } from "~/models/FileResource"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"

vi.mock("~/services/playlist/PlaylistService", () => ({
  fetchPlaylists: vi.fn(),
  createPlaylist: vi.fn()
}))

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>
}))

const createMockPlaylist = (id: string, title: string) => ({
  id,
  userId: "user-123",
  title,
  description: `Description for ${title}`,
  createdAt: DateTime.now(),
  videos: [],
  albumArt: None.of<FileResource<FileResourceType.AlbumArt>>()
})

const renderWithRouter = (initialPath: string = "/playlists") => {
  const routes = [
    {
      path: "/playlists",
      element: <Playlists />
    },
    {
      path: "/playlists/:playlistId",
      element: <div>Playlist Detail</div>
    }
  ]
  const router = createMemoryRouter(routes, {
    initialEntries: [initialPath]
  })

  return render(<RouterProvider router={router} />)
}

describe("Playlists", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { fetchPlaylists } = await import("~/services/playlist/PlaylistService")
    vi.mocked(fetchPlaylists).mockResolvedValue([
      createMockPlaylist("1", "Favorites"),
      createMockPlaylist("2", "Watch Later")
    ])
  })

  test("should render page title", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Playlists")).toBeInTheDocument()
    })
  })

  test("should render new playlist button", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /New Playlist/i })).toBeInTheDocument()
    })
  })

  test("should render playlists from API", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Favorites")).toBeInTheDocument()
      expect(screen.getByText("Watch Later")).toBeInTheDocument()
    })
  })

  test("should show empty state when no playlists", async () => {
    const { fetchPlaylists } = await import("~/services/playlist/PlaylistService")
    vi.mocked(fetchPlaylists).mockResolvedValue([])

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText(/No playlists yet/)).toBeInTheDocument()
    })
  })

  test("should open create dialog when new playlist button is clicked", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /New Playlist/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /New Playlist/i }))

    await waitFor(() => {
      expect(screen.getByText("Create New Playlist")).toBeInTheDocument()
    })
  })
})
