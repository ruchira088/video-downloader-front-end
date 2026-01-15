import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import AuthenticatedLayout from "~/pages/authenticated/AuthenticatedLayout"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"
import { None, Some } from "~/types/Option"

const mockNavigate = vi.fn()

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock("~/services/authentication/AuthenticationService", () => ({
  getAuthenticationToken: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  removeAuthenticationToken: vi.fn(),
  REDIRECT_QUERY_PARAMETER: "redirect",
}))

vi.mock("~/components/title-bar/Header", () => ({
  default: () => <div data-testid="header">Header</div>,
}))

describe("AuthenticatedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, "location", {
      value: { pathname: "/videos" },
      writable: true,
    })
  })

  test("should render header and outlet when authenticated", async () => {
    const { getAuthenticationToken, getAuthenticatedUser } = await import(
      "~/services/authentication/AuthenticationService"
    )
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of({ token: "test-token" }))
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ username: "testuser" })

    const router = createMemoryRouter([
      {
        path: "/",
        element: <AuthenticatedLayout />,
        children: [
          {
            index: true,
            element: <div data-testid="child">Child Content</div>,
          },
        ],
      },
    ])

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  test("should redirect to sign-in when not authenticated", async () => {
    const { getAuthenticationToken } = await import(
      "~/services/authentication/AuthenticationService"
    )
    vi.mocked(getAuthenticationToken).mockReturnValue(None.of())

    const router = createMemoryRouter([
      {
        path: "/",
        element: <AuthenticatedLayout />,
        children: [
          {
            index: true,
            element: <div>Child</div>,
          },
        ],
      },
    ])

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/sign-in?redirect=/videos")
    })
  })

  test("should redirect to sign-in when getAuthenticatedUser fails", async () => {
    const { getAuthenticationToken, getAuthenticatedUser, removeAuthenticationToken } =
      await import("~/services/authentication/AuthenticationService")
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of({ token: "test-token" }))
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new Error("Auth failed"))

    const router = createMemoryRouter([
      {
        path: "/",
        element: <AuthenticatedLayout />,
        children: [
          {
            index: true,
            element: <div>Child</div>,
          },
        ],
      },
    ])

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(removeAuthenticationToken).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith("/sign-in?redirect=/videos")
    })
  })

  test("should check authentication on mount", async () => {
    const { getAuthenticationToken, getAuthenticatedUser } = await import(
      "~/services/authentication/AuthenticationService"
    )
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of({ token: "test-token" }))
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ username: "testuser" })

    const router = createMemoryRouter([
      {
        path: "/",
        element: <AuthenticatedLayout />,
        children: [
          {
            index: true,
            element: <div>Child</div>,
          },
        ],
      },
    ])

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(getAuthenticationToken).toHaveBeenCalled()
      expect(getAuthenticatedUser).toHaveBeenCalled()
    })
  })
})
