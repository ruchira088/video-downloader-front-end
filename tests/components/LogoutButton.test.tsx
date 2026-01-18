import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LogoutButton from "~/components/quick-settings/switches/LogoutButton"
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

vi.mock("~/services/authentication/AuthenticationService", () => ({
  logout: vi.fn(),
}))

import { logout } from "~/services/authentication/AuthenticationService"

const mockLogout = vi.mocked(logout)

const renderWithRouter = () => {
  const routes = [
    {
      path: "/",
      element: <LogoutButton />,
    },
    {
      path: "/sign-in",
      element: <div>Sign In Page</div>,
    },
  ]
  const router = createMemoryRouter(routes, {
    initialEntries: ["/"],
  })

  return render(<RouterProvider router={router} />)
}

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render logout button", () => {
    renderWithRouter()

    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument()
  })

  test("should call logout and navigate to sign-in page when clicked", async () => {
    const user = userEvent.setup()
    mockLogout.mockResolvedValue(mockUser)

    renderWithRouter()

    const logoutButton = screen.getByRole("button", { name: /logout/i })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText("Sign In Page")).toBeInTheDocument()
    })
  })
})
