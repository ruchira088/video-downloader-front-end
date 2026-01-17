import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SignupForm from "~/pages/unauthenticated/signup/components/signup-form/SignupForm"
import { MemoryRouter } from "react-router"
import React from "react"
import { DateTime } from "luxon"
import { Role } from "~/models/User"

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

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe("SignupForm", () => {
  const mockOnSignup = vi.fn()
  const mockUser = {
    id: "user-123",
    createdAt: DateTime.now(),
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: Role.User,
  }
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
    test("should render first name input", () => {
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      expect(screen.getByLabelText("First Name")).toBeInTheDocument()
    })

    test("should render last name input", () => {
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      expect(screen.getByLabelText("Last Name")).toBeInTheDocument()
    })

    test("should render email input", () => {
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      expect(screen.getByLabelText("Email")).toBeInTheDocument()
    })

    test("should render password input", () => {
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      expect(screen.getByLabelText("Password")).toBeInTheDocument()
    })

    test("should render confirm password input", () => {
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument()
    })

    test("should render sign up button", () => {
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument()
    })

    test("should have empty inputs initially", () => {
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      expect(screen.getByLabelText("First Name")).toHaveValue("")
      expect(screen.getByLabelText("Last Name")).toHaveValue("")
      expect(screen.getByLabelText("Email")).toHaveValue("")
      expect(screen.getByLabelText("Password")).toHaveValue("")
      expect(screen.getByLabelText("Confirm Password")).toHaveValue("")
    })

    test("should render link to sign in page", () => {
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/sign-in")
    })
  })

  describe("Input Handling", () => {
    test("should update first name value on input", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      const input = screen.getByLabelText("First Name")
      await user.type(input, "John")

      expect(input).toHaveValue("John")
    })

    test("should update last name value on input", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      const input = screen.getByLabelText("Last Name")
      await user.type(input, "Doe")

      expect(input).toHaveValue("Doe")
    })

    test("should update email value on input", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      const input = screen.getByLabelText("Email")
      await user.type(input, "john@example.com")

      expect(input).toHaveValue("john@example.com")
    })

    test("should update password value on input", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      const input = screen.getByLabelText("Password")
      await user.type(input, "password123")

      expect(input).toHaveValue("password123")
    })

    test("should update confirm password value on input", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      const input = screen.getByLabelText("Confirm Password")
      await user.type(input, "password123")

      expect(input).toHaveValue("password123")
    })
  })

  describe("Password Visibility Toggle", () => {
    test("should toggle password visibility", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      const passwordInput = screen.getByLabelText("Password")
      expect(passwordInput).toHaveAttribute("type", "password")

      const toggleButtons = screen.getAllByRole("button", { name: /show password/i })
      await user.click(toggleButtons[0])

      expect(passwordInput).toHaveAttribute("type", "text")
    })

    test("should toggle confirm password visibility", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      expect(confirmPasswordInput).toHaveAttribute("type", "password")

      const toggleButtons = screen.getAllByRole("button", { name: /show password/i })
      await user.click(toggleButtons[1])

      expect(confirmPasswordInput).toHaveAttribute("type", "text")
    })
  })

  describe("Validation", () => {
    test("should show error when first name is empty", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/first name cannot be empty/i)).toBeInTheDocument()
      })
    })

    test("should show error when last name is empty", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/last name cannot be empty/i)).toBeInTheDocument()
      })
    })

    test("should show error when email is empty", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/email cannot be empty/i)).toBeInTheDocument()
      })
    })

    test("should show error when email is invalid", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "invalid-email")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    test("should show error when password is empty", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/password cannot be empty/i)).toBeInTheDocument()
      })
    })

    test("should show error when confirm password is empty", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/confirm password cannot be empty/i)).toBeInTheDocument()
      })
    })

    test("should show error when passwords do not match", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "different")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    test("should not call createUser when validation fails", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.click(screen.getByRole("button", { name: /sign up/i }))

      expect(mockCreateUser).not.toHaveBeenCalled()
    })

    test("should clear errors when user types", async () => {
      const user = userEvent.setup()
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/first name cannot be empty/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText("First Name"), "J")

      await waitFor(() => {
        expect(screen.queryByText(/first name cannot be empty/i)).not.toBeInTheDocument()
      })
    })
  })

  describe("Successful Signup", () => {
    test("should call createUser and login on successful signup", async () => {
      const user = userEvent.setup()
      mockCreateUser.mockResolvedValue(mockUser)
      mockLogin.mockResolvedValue(mockToken)
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          password: "password123",
        })
      })

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("john@example.com", "password123")
      })

      await waitFor(() => {
        expect(mockOnSignup).toHaveBeenCalled()
      })
    })

    test("should show loading state during submission", async () => {
      const user = userEvent.setup()
      mockCreateUser.mockImplementation(() => new Promise(() => {})) // Never resolves
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /creating account/i })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled()
      })
    })
  })

  describe("Failed Signup", () => {
    test("should display error message on 409 conflict (email exists)", async () => {
      const user = userEvent.setup()
      mockCreateUser.mockRejectedValue({ response: { status: 409 } })
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText("An account with this email already exists.")).toBeInTheDocument()
      })
    })

    test("should display error messages from API", async () => {
      const user = userEvent.setup()
      mockCreateUser.mockRejectedValue({
        response: {
          status: 400,
          data: { errors: ["Error 1", "Error 2"] }
        }
      })
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText("Error 1")).toBeInTheDocument()
        expect(screen.getByText("Error 2")).toBeInTheDocument()
      })
    })

    test("should handle Error object", async () => {
      const user = userEvent.setup()
      mockCreateUser.mockRejectedValue(new Error("Network error"))
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument()
      })
    })

    test("should handle null/undefined error gracefully", async () => {
      const user = userEvent.setup()
      mockCreateUser.mockRejectedValue(null)
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument()
      })
    })

    test("should not call onSignup on failure", async () => {
      const user = userEvent.setup()
      mockCreateUser.mockRejectedValue({ response: { status: 409 } })
      renderWithRouter(<SignupForm onSignup={mockOnSignup} />)

      await user.type(screen.getByLabelText("First Name"), "John")
      await user.type(screen.getByLabelText("Last Name"), "Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.type(screen.getByLabelText("Confirm Password"), "password123")
      await user.click(screen.getByRole("button", { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText("An account with this email already exists.")).toBeInTheDocument()
      })

      expect(mockOnSignup).not.toHaveBeenCalled()
    })
  })
})
