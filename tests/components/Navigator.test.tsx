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
    expect(screen.getByText("Information")).toBeInTheDocument()
  })

  test("should render navigation links with correct hrefs", () => {
    renderWithRouter()

    expect(screen.getByRole("link", { name: "Videos" })).toHaveAttribute("href", "/")
    expect(screen.getByRole("link", { name: "History" })).toHaveAttribute("href", "/history")
    expect(screen.getByRole("link", { name: "Playlists" })).toHaveAttribute("href", "/playlists")
    expect(screen.getByRole("link", { name: "Schedule" })).toHaveAttribute("href", "/schedule")
    expect(screen.getByRole("link", { name: "Downloading" })).toHaveAttribute("href", "/downloading")
    expect(screen.getByRole("link", { name: "Information" })).toHaveAttribute("href", "/information")
  })

  test("should render six navigation tabs", () => {
    renderWithRouter()

    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(6)
  })
})
