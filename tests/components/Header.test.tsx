import { describe, expect, test } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import Header from "~/components/title-bar/Header"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"
import { withApplicationConfiguration } from "../helpers"

const renderWithProviders = () => {
  const routes = [
    {
      path: "*",
      element: withApplicationConfiguration(<Header />),
    },
  ]
  const router = createMemoryRouter(routes, {
    initialEntries: ["/"],
  })

  return render(<RouterProvider router={router} />)
}

describe("Header", () => {
  test("should render logo image", async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByAltText("small logo")).toBeInTheDocument()
    })
  })

  test("should render 'Video Downloader' text", async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText("Video Downloader")).toBeInTheDocument()
    })
  })

  test("should render logo as a link to home", async () => {
    renderWithProviders()

    await waitFor(() => {
      const logoLink = screen.getByRole("link", { name: /small logo video downloader/i })
      expect(logoLink).toHaveAttribute("href", "/")
    })
  })

  test("should render Navigator component", async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText("Videos")).toBeInTheDocument()
      expect(screen.getByText("Schedule")).toBeInTheDocument()
    })
  })

  test("should render QuickSettings component", async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument()
    })
  })
})
