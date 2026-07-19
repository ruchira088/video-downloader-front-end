import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import AuthenticatedLayout from "~/pages/authenticated/AuthenticatedLayout"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"
import { None, Some } from "~/types/Option"
import { DateTime } from "luxon"
import { Role } from "~/models/User"

const createMockToken = (expiresAt = DateTime.now().plus({ hours: 1 })) => ({
  expiresAt,
  issuedAt: DateTime.now().minus({ days: 1 }),
  renewals: 0,
})

const createMockUser = () => ({
  id: "user-123",
  createdAt: DateTime.now(),
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  role: Role.User,
})

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
      value: { pathname: "/videos", search: "" },
      writable: true,
    })
  })

  test("should render header and outlet when authenticated", async () => {
    const { getAuthenticationToken, getAuthenticatedUser } = await import(
      "~/services/authentication/AuthenticationService"
    )
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(createMockToken()))
    vi.mocked(getAuthenticatedUser).mockResolvedValue(createMockUser())

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

    await waitFor(() => {
      expect(screen.getByTestId("header")).toBeInTheDocument()
      expect(screen.getByTestId("child")).toBeInTheDocument()
    })
  })

  test("should show a loading indicator and no children while the session check is pending", async () => {
    const { getAuthenticationToken, getAuthenticatedUser } = await import(
      "~/services/authentication/AuthenticationService"
    )
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(createMockToken()))
    vi.mocked(getAuthenticatedUser).mockReturnValue(new Promise(() => {}))

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

    expect(screen.getByRole("progressbar")).toBeInTheDocument()
    expect(screen.queryByTestId("header")).not.toBeInTheDocument()
    expect(screen.queryByTestId("child")).not.toBeInTheDocument()
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
            element: <div data-testid="child">Child</div>,
          },
        ],
      },
    ])

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/sign-in?redirect=%2Fvideos")
    })
    expect(screen.queryByTestId("child")).not.toBeInTheDocument()
  })

  test("should include the encoded query string in the sign-in redirect", async () => {
    const { getAuthenticationToken } = await import(
      "~/services/authentication/AuthenticationService"
    )
    vi.mocked(getAuthenticationToken).mockReturnValue(None.of())
    Object.defineProperty(window, "location", {
      value: { pathname: "/videos", search: "?search-term=cats&page=2" },
      writable: true,
    })

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
      expect(mockNavigate).toHaveBeenCalledWith(
        `/sign-in?redirect=${encodeURIComponent("/videos?search-term=cats&page=2")}`
      )
    })
  })

  test("should redirect to sign-in when getAuthenticatedUser fails", async () => {
    const { getAuthenticationToken, getAuthenticatedUser, removeAuthenticationToken } =
      await import("~/services/authentication/AuthenticationService")
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(createMockToken()))
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
      expect(mockNavigate).toHaveBeenCalledWith("/sign-in?redirect=%2Fvideos")
    })
  })

  test("should redirect to sign-in without a server check when the token is expired", async () => {
    const { getAuthenticationToken, getAuthenticatedUser, removeAuthenticationToken } =
      await import("~/services/authentication/AuthenticationService")
    vi.mocked(getAuthenticationToken).mockReturnValue(
      Some.of(createMockToken(DateTime.now().minus({ hours: 1 })))
    )

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
      expect(mockNavigate).toHaveBeenCalledWith("/sign-in?redirect=%2Fvideos")
    })
    expect(getAuthenticatedUser).not.toHaveBeenCalled()
  })

  test("should check authentication on mount", async () => {
    const { getAuthenticationToken, getAuthenticatedUser } = await import(
      "~/services/authentication/AuthenticationService"
    )
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(createMockToken()))
    vi.mocked(getAuthenticatedUser).mockResolvedValue(createMockUser())

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
