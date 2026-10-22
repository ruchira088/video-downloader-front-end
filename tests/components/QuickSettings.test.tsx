import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import QuickSettings from "~/components/quick-settings/QuickSettings"
import React from "react"
import { MemoryRouter } from "react-router"
import { withApplicationConfiguration, withAuthenticatedUser } from "../helpers"
import { Role } from "~/models/User"

vi.mock("~/services/authentication/AuthenticationService", () => ({
  logout: vi.fn(),
}))

const renderWithContext = (role: Role = Role.Admin) =>
  render(<MemoryRouter>{withAuthenticatedUser(withApplicationConfiguration(<QuickSettings />), role)}</MemoryRouter>)

describe("QuickSettings", () => {
  test("should render ThemeSwitch", () => {
    renderWithContext()

    expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument()
  })

  test("should render SafeModeSwitch", () => {
    renderWithContext()

    expect(screen.getByLabelText("Enable safe mode")).toBeInTheDocument()
  })

  test("should render LogoutButton", () => {
    renderWithContext()

    expect(screen.getByLabelText("Logout")).toBeInTheDocument()
  })

  test.each([Role.Admin, Role.User])("should not offer to pause downloads to %s users", (role) => {
    renderWithContext(role)

    expect(screen.queryByRole("button", { name: /downloads/i })).not.toBeInTheDocument()
  })
})
