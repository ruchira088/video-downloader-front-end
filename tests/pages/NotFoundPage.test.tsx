import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import NotFoundPage from "~/pages/not-found/NotFoundPage"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"

describe("NotFoundPage", () => {
  const renderPage = () => {
    const router = createMemoryRouter(
      [
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
      { initialEntries: ["/some/unknown/path"] }
    )

    return render(<RouterProvider router={router} />)
  }

  test("should render 404 message", () => {
    renderPage()

    expect(screen.getByText("404")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument()
    expect(screen.getByText(/does not exist or may have been moved/)).toBeInTheDocument()
  })

  test("should render link back to home", () => {
    renderPage()

    const link = screen.getByRole("link", { name: "Back to Home" })

    expect(link).toHaveAttribute("href", "/")
  })

  test("should set document title", () => {
    renderPage()

    expect(document.title).toBe("Page Not Found")
  })
})
