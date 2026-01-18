import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SignupPage from "~/pages/unauthenticated/signup/SignupPage"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"
import { DateTime } from "luxon"
import { Role } from "~/models/User"

const mockUser = {
  id: "user-123",
  createdAt: DateTime.now(),
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  role: Role.User,
}

const mockToken = {
  secret: "test-secret",
  expiresAt: DateTime.now().plus({ days: 1 }),
  issuedAt: DateTime.now(),
  renewals: 0,
}

vi.mock("~/services/user/UserService", () => ({
  createUser: vi.fn(),
}))

vi.mock("~/services/authentication/AuthenticationService", () => ({
  login: vi.fn(),
}))

import { createUser } from "~/services/user/UserService"
import { login } from "~/services/authentication/AuthenticationService"

const mockCreateUser = vi.mocked(createUser)
const mockLogin = vi.mocked(login)

const renderWithRouter = (initialPath: string = "/sign-up") => {
  const routes = [
    {
      path: "/sign-up",
      element: <SignupPage />,
    },
    {
      path: "/",
      element: <div>Home Page</div>,
    },
  ]
  const router = createMemoryRouter(routes, {
    initialEntries: [initialPath],
  })

  return render(<RouterProvider router={router} />)
}

describe("SignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render signup form", () => {
    renderWithRouter()

    expect(screen.getByText("Create your account")).toBeInTheDocument()
  })

  test("should render the page title", () => {
    renderWithRouter()

    expect(screen.getByText("Video Downloader")).toBeInTheDocument()
  })

  test("should render first name input", () => {
    renderWithRouter()

    expect(screen.getByLabelText("First Name")).toBeInTheDocument()
  })

  test("should render last name input", () => {
    renderWithRouter()

    expect(screen.getByLabelText("Last Name")).toBeInTheDocument()
  })

  test("should render email input", () => {
    renderWithRouter()

    expect(screen.getByLabelText("Email")).toBeInTheDocument()
  })

  test("should render password input", () => {
    renderWithRouter()

    expect(screen.getByLabelText("Password")).toBeInTheDocument()
  })

  test("should render confirm password input", () => {
    renderWithRouter()

    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument()
  })

  test("should render sign up button", () => {
    renderWithRouter()

    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument()
  })

  test("should render link to sign in page", () => {
    renderWithRouter()

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/sign-in")
  })

  test("should navigate to home page after successful signup", async () => {
    const user = userEvent.setup()
    mockCreateUser.mockResolvedValue(mockUser)
    mockLogin.mockResolvedValue(mockToken)

    renderWithRouter()

    // Fill in the form
    await user.type(screen.getByLabelText("First Name"), "Test")
    await user.type(screen.getByLabelText("Last Name"), "User")
    await user.type(screen.getByLabelText("Email"), "test@example.com")
    await user.type(screen.getByLabelText("Password"), "password123")
    await user.type(screen.getByLabelText("Confirm Password"), "password123")

    // Submit the form
    await user.click(screen.getByRole("button", { name: /sign up/i }))

    // Wait for navigation to home page
    await waitFor(() => {
      expect(screen.getByText("Home Page")).toBeInTheDocument()
    })
  })
})
