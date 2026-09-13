import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Navigator from "~/components/navigator/Navigator"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"

const renderWithRouter = (initialPath: string = "/") => {
  const routes = [
    {
      path: "*",
      element: <Navigator />,
    },
  ]
  const router = createMemoryRouter(routes, {
    initialEntries: [initialPath],
  })

  return render(<RouterProvider router={router} />)
}

/** tests/setup.ts mocks matchMedia to never match, which is the desktop layout. */
const mockViewport = (matches: boolean) =>
  vi.mocked(window.matchMedia).mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))

describe("Navigator", () => {
  describe("desktop tabs", () => {
    test("should render all navigation tabs", () => {
      renderWithRouter()

      expect(screen.getByText("Videos")).toBeInTheDocument()
      expect(screen.getByText("History")).toBeInTheDocument()
      expect(screen.getByText("Playlists")).toBeInTheDocument()
      expect(screen.getByText("Schedule")).toBeInTheDocument()
      expect(screen.getByText("Downloading")).toBeInTheDocument()
      expect(screen.getByText("Duplicates")).toBeInTheDocument()
      expect(screen.getByText("Information")).toBeInTheDocument()
    })

    test("should render navigation links with correct hrefs", () => {
      renderWithRouter()

      expect(screen.getByRole("link", { name: "Videos" })).toHaveAttribute("href", "/")
      expect(screen.getByRole("link", { name: "History" })).toHaveAttribute("href", "/history")
      expect(screen.getByRole("link", { name: "Playlists" })).toHaveAttribute("href", "/playlists")
      expect(screen.getByRole("link", { name: "Schedule" })).toHaveAttribute("href", "/schedule")
      expect(screen.getByRole("link", { name: "Downloading" })).toHaveAttribute("href", "/downloading")
      expect(screen.getByRole("link", { name: "Duplicates" })).toHaveAttribute("href", "/duplicates")
      expect(screen.getByRole("link", { name: "Information" })).toHaveAttribute("href", "/information")
    })

    test("should render seven navigation tabs", () => {
      renderWithRouter()

      const links = screen.getAllByRole("link")
      expect(links).toHaveLength(7)
    })

    test("should render an icon in every tab", () => {
      renderWithRouter()

      const iconTestIds = [
        "VideoLibraryIcon",
        "HistoryIcon",
        "PlaylistPlayIcon",
        "ScheduleIcon",
        "DownloadIcon",
        "ContentCopyIcon",
        "InfoIcon"
      ]

      screen.getAllByRole("link").forEach((link, index) => {
        expect(within(link).getByTestId(iconTestIds[index])).toBeInTheDocument()
      })
    })

    test("should not render the bottom bar", () => {
      renderWithRouter()

      expect(screen.queryByRole("button", { name: "More" })).not.toBeInTheDocument()
    })

    test("should mark the correct tab as active for nested paths", () => {
      renderWithRouter("/playlists/123")

      // The Playlists tab should be active when on a nested playlist path
      const playlistsLink = screen.getByRole("link", { name: "Playlists" })
      // CSS module class names contain "isActive"
      expect(playlistsLink.className).toContain("isActive")
    })

    test("should mark the correct tab as active for history path", () => {
      renderWithRouter("/history")

      const historyLink = screen.getByRole("link", { name: "History" })
      expect(historyLink.className).toContain("isActive")
    })

    test("should default to Videos tab when on root path", () => {
      renderWithRouter("/")

      const videosLink = screen.getByRole("link", { name: "Videos" })
      expect(videosLink.className).toContain("isActive")
    })

    test("should fall back to the Videos tab for a path that matches no tab", () => {
      renderWithRouter("/not-a-known-section")

      const videosLink = screen.getByRole("link", { name: "Videos" })
      expect(videosLink.className).toContain("isActive")
    })

    test("should mark only one tab as active at a time", () => {
      renderWithRouter("/playlists/123")

      const activeLinks = screen.getAllByRole("link").filter(link => link.className.includes("isActive"))
      expect(activeLinks).toHaveLength(1)
      expect(activeLinks[0]).toHaveAccessibleName("Playlists")
    })

    test("should keep the owning tab active on a deeply nested path", () => {
      renderWithRouter("/downloading/abc/def")

      const downloadingLink = screen.getByRole("link", { name: "Downloading" })
      expect(downloadingLink.className).toContain("isActive")
    })
  })

  describe("mobile bottom bar", () => {
    beforeEach(() => {
      mockViewport(true)
    })

    afterEach(() => {
      mockViewport(false)
    })

    test("should render the four primary tabs as links and the rest behind More", () => {
      renderWithRouter()

      const links = screen.getAllByRole("link")
      expect(links.map(link => link.getAttribute("href"))).toEqual(["/", "/history", "/playlists", "/downloading"])
      expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument()

      expect(screen.queryByText("Schedule")).not.toBeInTheDocument()
      expect(screen.queryByText("Duplicates")).not.toBeInTheDocument()
      expect(screen.queryByText("Information")).not.toBeInTheDocument()
    })

    test("should open the overflow menu with links to the remaining pages", async () => {
      const user = userEvent.setup()
      renderWithRouter()

      await user.click(screen.getByRole("button", { name: "More" }))

      const menu = screen.getByRole("menu")
      expect(within(menu).getByRole("menuitem", { name: "Schedule" })).toHaveAttribute("href", "/schedule")
      expect(within(menu).getByRole("menuitem", { name: "Duplicates" })).toHaveAttribute("href", "/duplicates")
      expect(within(menu).getByRole("menuitem", { name: "Information" })).toHaveAttribute("href", "/information")
    })

    test("should close the overflow menu after choosing a page", async () => {
      const user = userEvent.setup()
      renderWithRouter()

      await user.click(screen.getByRole("button", { name: "More" }))
      await user.click(screen.getByRole("menuitem", { name: "Schedule" }))

      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    })

    test("should mark the primary tab active on its own path", () => {
      renderWithRouter("/playlists/123")

      expect(screen.getByRole("link", { name: "Playlists" }).className).toContain("isActive")
      expect(screen.getByRole("button", { name: "More" }).className).not.toContain("isActive")
    })

    test("should mark More active when on a page it holds", () => {
      renderWithRouter("/duplicates")

      expect(screen.getByRole("button", { name: "More" }).className).toContain("isActive")
      expect(screen.getAllByRole("link").filter(link => link.className.includes("isActive"))).toHaveLength(0)
    })

    test("should highlight the current page inside the overflow menu", async () => {
      const user = userEvent.setup()
      renderWithRouter("/information")

      await user.click(screen.getByRole("button", { name: "More" }))

      expect(screen.getByRole("menuitem", { name: "Information" })).toHaveClass("Mui-selected")
      expect(screen.getByRole("menuitem", { name: "Schedule" })).not.toHaveClass("Mui-selected")
    })
  })
})
