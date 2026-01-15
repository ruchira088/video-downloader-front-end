import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import UnauthenticatedLayout from "~/pages/unauthenticated/UnauthenticatedLayout"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"
import { None, Some } from "~/types/Option"
import { DateTime } from "luxon"
import { Role } from "~/models/User"

const createMockToken = () => ({
  secret: "test-token",
  expiresAt: DateTime.now().plus({ hours: 1 }),
  issuedAt: DateTime.now(),
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
}))

describe("UnauthenticatedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render outlet", async () => {
    const { getAuthenticationToken } = await import("~/services/authentication/AuthenticationService")
    vi.mocked(getAuthenticationToken).mockReturnValue(None.of())

    const router = createMemoryRouter([
      {
        path: "/",
        element: <UnauthenticatedLayout />,
        children: [
          {
            index: true,
            element: <div data-testid="child">Child Content</div>,
          },
        ],
      },
    ])

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  test("should check authentication on mount", async () => {
    const { getAuthenticationToken } = await import("~/services/authentication/AuthenticationService")
    vi.mocked(getAuthenticationToken).mockReturnValue(None.of())

    const router = createMemoryRouter([
      {
        path: "/",
        element: <UnauthenticatedLayout />,
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
    })
  })

  test("should navigate to home when already authenticated", async () => {
    const { getAuthenticationToken, getAuthenticatedUser } = await import("~/services/authentication/AuthenticationService")
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(createMockToken()))
    vi.mocked(getAuthenticatedUser).mockResolvedValue(createMockUser())

    const router = createMemoryRouter([
      {
        path: "/",
        element: <UnauthenticatedLayout />,
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
      expect(mockNavigate).toHaveBeenCalledWith("/")
    })
  })

  test("should stay on page when token exists but getAuthenticatedUser fails", async () => {
    const { getAuthenticationToken, getAuthenticatedUser } = await import("~/services/authentication/AuthenticationService")
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(createMockToken()))
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new Error("Auth failed"))

    const router = createMemoryRouter([
      {
        path: "/",
        element: <UnauthenticatedLayout />,
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
      expect(getAuthenticatedUser).toHaveBeenCalled()
    })

    // Wait a bit and check navigate was not called
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(mockNavigate).not.toHaveBeenCalledWith("/")
  })
})
