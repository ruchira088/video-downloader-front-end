import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import SignupPage from "~/pages/unauthenticated/signup/SignupPage"
import { createMemoryRouter, RouterProvider } from "react-router"
import React from "react"

vi.mock("~/services/user/UserService", () => ({
  createUser: vi.fn(),
}))

vi.mock("~/services/authentication/AuthenticationService", () => ({
  login: vi.fn(),
}))

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
})
