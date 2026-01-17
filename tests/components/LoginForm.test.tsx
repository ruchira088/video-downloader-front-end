import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LoginForm from "~/pages/unauthenticated/login/components/login-form/LoginForm"
import { DateTime } from "luxon"
import { MemoryRouter } from "react-router"
import React from "react"

// Mock the authentication service
vi.mock("~/services/authentication/AuthenticationService", () => ({
  login: vi.fn(),
}))

import { login } from "~/services/authentication/AuthenticationService"

const mockLogin = vi.mocked(login)

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe("LoginForm", () => {
  const mockOnAuthenticate = vi.fn()
  const mockToken = {
    secret: "test-secret",
    expiresAt: DateTime.now().plus({ days: 1 }),
    issuedAt: DateTime.now(),
    renewals: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial Render", () => {
    test("should render email input", () => {
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    test("should render password input", () => {
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    test("should render login button", () => {
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument()
    })

    test("should have empty inputs initially", () => {
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      expect(screen.getByLabelText(/email/i)).toHaveValue("")
      expect(screen.getByLabelText(/password/i)).toHaveValue("")
    })

    test("should have email input with type email", () => {
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email")
    })

    test("should have password input with type password", () => {
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      expect(screen.getByLabelText(/password/i)).toHaveAttribute("type", "password")
    })
  })

  describe("Input Handling", () => {
    test("should update email value on input", async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, "test@example.com")

      expect(emailInput).toHaveValue("test@example.com")
    })

    test("should update password value on input", async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, "secretpassword")

      expect(passwordInput).toHaveValue("secretpassword")
    })
  })

  describe("Validation", () => {
    test("should show error when email is empty on submit", async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      // Fill password but leave email empty
      await user.type(screen.getByLabelText(/password/i), "password123")
      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument()
      })
    })

    test("should show error when password is empty on submit", async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      // Fill email but leave password empty
      await user.type(screen.getByLabelText(/email/i), "test@example.com")
      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument()
      })
    })

    test("should show both errors when both fields empty", async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        const errors = screen.getAllByText(/cannot be empty/i)
        expect(errors).toHaveLength(2)
      })
    })

    test("should not call login when validation fails", async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.click(screen.getByRole("button", { name: /login/i }))

      expect(mockLogin).not.toHaveBeenCalled()
    })

    test("should clear errors when user types", async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      // Submit to trigger errors
      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(screen.getAllByText(/cannot be empty/i)).toHaveLength(2)
      })

      // Type in email field
      await user.type(screen.getByLabelText(/email/i), "a")

      await waitFor(() => {
        expect(screen.queryByText(/cannot be empty/i)).not.toBeInTheDocument()
      })
    })

    test("should treat whitespace-only as empty", async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.type(screen.getByLabelText(/email/i), "   ")
      await user.type(screen.getByLabelText(/password/i), "password123")
      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument()
      })
    })
  })

  describe("Successful Login", () => {
    test("should call login with email and password", async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue(mockToken)
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.type(screen.getByLabelText(/email/i), "test@example.com")
      await user.type(screen.getByLabelText(/password/i), "password123")
      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123")
      })
    })

    test("should call onAuthenticate with token on success", async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue(mockToken)
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.type(screen.getByLabelText(/email/i), "test@example.com")
      await user.type(screen.getByLabelText(/password/i), "password123")
      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(mockOnAuthenticate).toHaveBeenCalledWith(mockToken)
      })
    })
  })

  describe("Failed Login", () => {
    test("should display error message on 401 failure", async () => {
      const user = userEvent.setup()
      mockLogin.mockRejectedValue({ response: { status: 401 } })
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.type(screen.getByLabelText(/email/i), "test@example.com")
      await user.type(screen.getByLabelText(/password/i), "wrongpassword")
      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByText("Invalid email or password. Please try again.")).toBeInTheDocument()
      })
    })

    test("should not call onAuthenticate on failure", async () => {
      const user = userEvent.setup()
      mockLogin.mockRejectedValue({ response: { status: 401 } })
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.type(screen.getByLabelText(/email/i), "test@example.com")
      await user.type(screen.getByLabelText(/password/i), "wrongpassword")
      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByText("Invalid email or password. Please try again.")).toBeInTheDocument()
      })
      expect(mockOnAuthenticate).not.toHaveBeenCalled()
    })

    test("should handle multiple error messages from API", async () => {
      const user = userEvent.setup()
      mockLogin.mockRejectedValue({
        response: {
          status: 400,
          data: { errors: ["Error 1", "Error 2", "Error 3"] }
        }
      })
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.type(screen.getByLabelText(/email/i), "test@example.com")
      await user.type(screen.getByLabelText(/password/i), "wrongpassword")
      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByText("Error 1")).toBeInTheDocument()
        expect(screen.getByText("Error 2")).toBeInTheDocument()
        expect(screen.getByText("Error 3")).toBeInTheDocument()
      })
    })

    test("should handle null/undefined error gracefully", async () => {
      const user = userEvent.setup()
      mockLogin.mockRejectedValue(null)
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.type(screen.getByLabelText(/email/i), "test@example.com")
      await user.type(screen.getByLabelText(/password/i), "wrongpassword")
      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument()
      })
      expect(mockOnAuthenticate).not.toHaveBeenCalled()
    })

    test("should handle Error object", async () => {
      const user = userEvent.setup()
      mockLogin.mockRejectedValue(new Error("Network error"))
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.type(screen.getByLabelText(/email/i), "test@example.com")
      await user.type(screen.getByLabelText(/password/i), "wrongpassword")
      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument()
      })
    })
  })

  describe("Input Error States", () => {
    test("should show TextField in error state when validation fails", async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.click(screen.getByRole("button", { name: /login/i }))

      // MUI TextField with error shows aria-invalid
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-invalid", "true")
        expect(screen.getByLabelText(/password/i)).toHaveAttribute("aria-invalid", "true")
      })
    })

    test("should remove error state when user types", async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginForm onAuthenticate={mockOnAuthenticate} />)

      await user.click(screen.getByRole("button", { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-invalid", "true")
      })

      await user.type(screen.getByLabelText(/email/i), "a")

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-invalid", "false")
      })
    })
  })
})
