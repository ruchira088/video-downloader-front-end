import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
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

describe("Navigator", () => {
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
    // MUI throws if the selected Tabs value is not one of the rendered tabs, so an
    // unrecognised path has to resolve to a real tab rather than to nothing.
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
