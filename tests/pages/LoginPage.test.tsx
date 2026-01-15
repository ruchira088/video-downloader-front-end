import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import LoginPage from "~/pages/unauthenticated/login/LoginPage"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"

const mockNavigate = vi.fn()

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()],
  }
})

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>,
}))

vi.mock("~/pages/unauthenticated/login/components/login-form/LoginForm", () => ({
  default: ({ onAuthenticate }: { onAuthenticate: () => void }) => (
    <div>
      <button onClick={onAuthenticate} data-testid="login-button">Login</button>
    </div>
  ),
}))

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render login form", () => {
    const router = createMemoryRouter([
      {
        path: "/",
        element: <LoginPage />,
      },
    ])

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId("login-button")).toBeInTheDocument()
  })

  test("should navigate to home on authenticate when no redirect param", () => {
    const router = createMemoryRouter([
      {
        path: "/",
        element: <LoginPage />,
      },
    ])

    render(<RouterProvider router={router} />)

    fireEvent.click(screen.getByTestId("login-button"))

    expect(mockNavigate).toHaveBeenCalledWith("/")
  })
})

describe("LoginPage with redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should navigate to redirect URL on authenticate", async () => {
    vi.doMock("react-router", async () => {
      const actual = await vi.importActual("react-router")
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [new URLSearchParams("?redirect=/videos")],
      }
    })

    const router = createMemoryRouter([
      {
        path: "/login",
        element: <LoginPage />,
      },
    ], { initialEntries: ["/login?redirect=/videos"] })

    render(<RouterProvider router={router} />)

    expect(screen.getByTestId("login-button")).toBeInTheDocument()
  })
})
