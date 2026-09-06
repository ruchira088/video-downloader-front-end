import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Playlists from "~/pages/authenticated/playlists/Playlists"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"
import { buildPlaylist } from "../fixtures"
import { triggerIntersection } from "../helpers"
import { intersectionObserverCallbacks } from "../setup"

const createMockPlaylist = (id: string, title: string) =>
  buildPlaylist({ id, title, description: `Description for ${title}` })

const playlistPage = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => createMockPlaylist(`${from + i}`, `Playlist ${from + i}`))

vi.mock("~/services/playlist/PlaylistService", () => ({
  fetchPlaylists: vi.fn(),
  createPlaylist: vi.fn()
}))

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>
}))

vi.mock("~/providers/ApplicationConfigurationProvider", () => ({
  useApplicationConfiguration: () => ({
    safeMode: false,
  }),
}))

import { fetchPlaylists } from "~/services/playlist/PlaylistService"

const mockFetchPlaylists = vi.mocked(fetchPlaylists)

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
  beforeEach(() => {
    vi.clearAllMocks()
    intersectionObserverCallbacks.length = 0
    mockFetchPlaylists.mockResolvedValue([
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

  test("should link each playlist to its detail page", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Favorites/ })).toHaveAttribute("href", "/playlists/1")
    })
  })

  test("should show empty state when no playlists", async () => {
    mockFetchPlaylists.mockResolvedValue([])

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

  describe("Pagination", () => {
    test("should load the next page when the scroll trigger intersects", async () => {
      mockFetchPlaylists
        .mockResolvedValueOnce(playlistPage(1, 50))
        .mockResolvedValueOnce(playlistPage(51, 10))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("Playlist 1")).toBeInTheDocument()
      })
      expect(mockFetchPlaylists).toHaveBeenCalledTimes(1)

      await triggerIntersection()

      await waitFor(() => {
        expect(screen.getByText("Playlist 51")).toBeInTheDocument()
      })
      expect(mockFetchPlaylists).toHaveBeenCalledTimes(2)
      // Earlier pages stay in place beneath the new one.
      expect(screen.getByText("Playlist 1")).toBeInTheDocument()
    })

    test("should show the end message once every playlist has been loaded", async () => {
      mockFetchPlaylists.mockResolvedValue(playlistPage(1, 10))

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText("No more playlists")).toBeInTheDocument()
      })

      const callsBefore = mockFetchPlaylists.mock.calls.length
      await triggerIntersection()
      expect(mockFetchPlaylists.mock.calls.length).toBe(callsBefore)
    })

    test("should not show the end message on an empty list", async () => {
      mockFetchPlaylists.mockResolvedValue([])

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByText(/No playlists yet/)).toBeInTheDocument()
      })

      expect(screen.queryByText("No more playlists")).not.toBeInTheDocument()
    })

    test("should offer a retry instead of the empty state when loading fails", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
      mockFetchPlaylists
        .mockRejectedValueOnce(new Error("Network down"))
        .mockResolvedValueOnce([createMockPlaylist("1", "Favorites")])

      renderWithRouter()

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong while loading.")
      })
      // A failed load is not "no playlists": the empty state must not claim there are none.
      expect(screen.queryByText(/No playlists yet/)).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole("button", { name: /retry/i }))

      await waitFor(() => {
        expect(screen.getByText("Favorites")).toBeInTheDocument()
      })
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()

      consoleError.mockRestore()
    })
  })
})
