import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import LoginPage from "~/pages/unauthenticated/login/LoginPage"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"

const mockNavigate = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
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

const renderLoginPage = () => {
  const router = createMemoryRouter([
    {
      path: "/",
      element: <LoginPage />,
    },
  ])

  render(<RouterProvider router={router} />)
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  test("should render login form", () => {
    renderLoginPage()

    expect(screen.getByTestId("login-button")).toBeInTheDocument()
  })

  test("should navigate to home on authenticate when no redirect param", () => {
    renderLoginPage()

    fireEvent.click(screen.getByTestId("login-button"))

    expect(mockNavigate).toHaveBeenCalledWith("/")
  })

  test("should navigate to in-app redirect path on authenticate", () => {
    mockSearchParams = new URLSearchParams("?redirect=/history")

    renderLoginPage()

    fireEvent.click(screen.getByTestId("login-button"))

    expect(mockNavigate).toHaveBeenCalledWith("/history")
  })

  test("should fall back to home when redirect is an external URL", () => {
    mockSearchParams = new URLSearchParams("?redirect=https://evil.example")

    renderLoginPage()

    fireEvent.click(screen.getByTestId("login-button"))

    expect(mockNavigate).toHaveBeenCalledWith("/")
  })

  test("should fall back to home when redirect is a protocol-relative URL", () => {
    mockSearchParams = new URLSearchParams("?redirect=//evil.example")

    renderLoginPage()

    fireEvent.click(screen.getByTestId("login-button"))

    expect(mockNavigate).toHaveBeenCalledWith("/")
  })
})
