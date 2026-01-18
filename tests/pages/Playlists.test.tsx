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

  test("should close dialog when cancel button is clicked", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /New Playlist/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /New Playlist/i }))

    await waitFor(() => {
      expect(screen.getByText("Create New Playlist")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }))

    await waitFor(() => {
      expect(screen.queryByText("Create New Playlist")).not.toBeInTheDocument()
    })
  })

  test("should add new playlist to list when created and close dialog", async () => {
    const { createPlaylist } = await import("~/services/playlist/PlaylistService")
    const newPlaylist = createMockPlaylist("3", "My New Playlist")
    vi.mocked(createPlaylist).mockResolvedValue(newPlaylist)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Favorites")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /New Playlist/i }))

    await waitFor(() => {
      expect(screen.getByText("Create New Playlist")).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/Name/i)
    fireEvent.change(nameInput, { target: { value: "My New Playlist" } })

    fireEvent.click(screen.getByRole("button", { name: /^Create$/i }))

    await waitFor(() => {
      expect(screen.getByText("My New Playlist")).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.queryByText("Create New Playlist")).not.toBeInTheDocument()
    })
  })

  test("should show Load More button when there are more playlists", async () => {
    const { fetchPlaylists } = await import("~/services/playlist/PlaylistService")
    const manyPlaylists = Array.from({ length: 50 }, (_, i) =>
      createMockPlaylist(`${i + 1}`, `Playlist ${i + 1}`)
    )
    vi.mocked(fetchPlaylists).mockResolvedValue(manyPlaylists)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Playlist 1")).toBeInTheDocument()
    })

    expect(screen.getByRole("button", { name: /Load More/i })).toBeInTheDocument()
  })

  test("should load more playlists when Load More button is clicked", async () => {
    const { fetchPlaylists } = await import("~/services/playlist/PlaylistService")
    const firstPagePlaylists = Array.from({ length: 50 }, (_, i) =>
      createMockPlaylist(`${i + 1}`, `Playlist ${i + 1}`)
    )
    const secondPagePlaylists = Array.from({ length: 10 }, (_, i) =>
      createMockPlaylist(`${i + 51}`, `Playlist ${i + 51}`)
    )

    vi.mocked(fetchPlaylists)
      .mockResolvedValueOnce(firstPagePlaylists)
      .mockResolvedValueOnce(secondPagePlaylists)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Playlist 1")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /Load More/i }))

    await waitFor(() => {
      expect(screen.getByText("Playlist 51")).toBeInTheDocument()
    })
  })

  test("should hide Load More button when all playlists are loaded", async () => {
    const { fetchPlaylists } = await import("~/services/playlist/PlaylistService")
    const firstPagePlaylists = Array.from({ length: 50 }, (_, i) =>
      createMockPlaylist(`${i + 1}`, `Playlist ${i + 1}`)
    )
    const lastPagePlaylists = Array.from({ length: 10 }, (_, i) =>
      createMockPlaylist(`${i + 51}`, `Playlist ${i + 51}`)
    )

    vi.mocked(fetchPlaylists)
      .mockResolvedValueOnce(firstPagePlaylists)
      .mockResolvedValueOnce(lastPagePlaylists)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Playlist 1")).toBeInTheDocument()
    })

    expect(screen.getByRole("button", { name: /Load More/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Load More/i }))

    await waitFor(() => {
      expect(screen.getByText("Playlist 51")).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Load More/i })).not.toBeInTheDocument()
    })
  })

  test("should not show Load More button when fewer than page size playlists returned", async () => {
    const { fetchPlaylists } = await import("~/services/playlist/PlaylistService")
    const fewPlaylists = Array.from({ length: 10 }, (_, i) =>
      createMockPlaylist(`${i + 1}`, `Playlist ${i + 1}`)
    )
    vi.mocked(fetchPlaylists).mockResolvedValue(fewPlaylists)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Playlist 1")).toBeInTheDocument()
    })

    expect(screen.queryByRole("button", { name: /Load More/i })).not.toBeInTheDocument()
  })
})
