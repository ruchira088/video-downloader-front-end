import { describe, expect, test, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AuthenticatedLayout from "~/pages/authenticated/AuthenticatedLayout"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"
import { buildStoredAuthenticationToken, buildUser } from "../fixtures"
import { None, Some } from "~/types/Option"
import { DateTime } from "luxon"
import { Role } from "~/models/User"
import { useAuthenticatedUser, useIsAdmin } from "~/providers/AuthenticatedUserProvider"

const createMockToken = (expiresAt: DateTime = DateTime.now().plus({ hours: 1 })) =>
  buildStoredAuthenticationToken({
    expiresAt: expiresAt.toISO(),
    issuedAt: DateTime.now().minus({ days: 1 }).toISO()
  })

const createMockUser = () => buildUser()

const httpError = (status: number) =>
  Object.assign(new Error("Request failed"), { isAxiosError: true, response: { status } })

const renderLayout = () =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: "/",
          element: <AuthenticatedLayout />,
          children: [{ index: true, element: <div data-testid="child">Child Content</div> }],
        },
      ])}
    />
  )

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

  test("should give the outlet the signed-in user", async () => {
    const { getAuthenticationToken, getAuthenticatedUser } = await import(
      "~/services/authentication/AuthenticationService"
    )
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(createMockToken()))
    vi.mocked(getAuthenticatedUser).mockResolvedValue(buildUser({ role: Role.Admin, email: "admin@example.com" }))

    const UserProbe = () => {
      const email = useAuthenticatedUser().map(user => user.email).getOrElse(() => "none")
      return <div data-testid="user">{email} {useIsAdmin() ? "admin" : "user"}</div>
    }

    render(
      <RouterProvider
        router={createMemoryRouter([
          { path: "/", element: <AuthenticatedLayout />, children: [{ index: true, element: <UserProbe /> }] },
        ])}
      />
    )

    expect(await screen.findByTestId("user")).toHaveTextContent("admin@example.com admin")
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

    expect(screen.getByRole("progressbar", { name: "Loading" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Video Downloader" })).toBeInTheDocument()
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

  test("should redirect to sign-in when the session check returns 401", async () => {
    const { getAuthenticationToken, getAuthenticatedUser, removeAuthenticationToken } =
      await import("~/services/authentication/AuthenticationService")
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(createMockToken()))
    vi.mocked(getAuthenticatedUser).mockRejectedValue(httpError(401))

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

  test.each([
    ["a network error", new Error("Network Error")],
    ["a server error", httpError(503)],
  ])("should keep the token and show a retry screen when the session check fails with %s", async (_, error) => {
    const { getAuthenticationToken, getAuthenticatedUser, removeAuthenticationToken } =
      await import("~/services/authentication/AuthenticationService")
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(createMockToken()))
    vi.mocked(getAuthenticatedUser).mockRejectedValue(error)

    renderLayout()

    expect(await screen.findByRole("heading", { name: "Unable to connect" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
    expect(removeAuthenticationToken).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.queryByTestId("header")).not.toBeInTheDocument()
    expect(screen.queryByTestId("child")).not.toBeInTheDocument()
  })

  test("should re-check the session and render the content when retry succeeds", async () => {
    const { getAuthenticationToken, getAuthenticatedUser } = await import(
      "~/services/authentication/AuthenticationService"
    )
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(createMockToken()))
    vi.mocked(getAuthenticatedUser).mockRejectedValueOnce(new Error("Network Error"))

    renderLayout()

    const retryButton = await screen.findByRole("button", { name: "Retry" })
    let resolveUser: (user: ReturnType<typeof createMockUser>) => void = () => {}
    vi.mocked(getAuthenticatedUser).mockReturnValueOnce(new Promise(resolve => { resolveUser = resolve }))
    fireEvent.click(retryButton)

    expect(screen.getByRole("progressbar", { name: "Loading" })).toBeInTheDocument()

    resolveUser(createMockUser())

    expect(await screen.findByTestId("child")).toBeInTheDocument()
    expect(screen.getByTestId("header")).toBeInTheDocument()
    expect(getAuthenticatedUser).toHaveBeenCalledTimes(2)
  })
})
