import { describe, expect, test, vi, beforeEach } from "vitest"
import { createUser, type CreateUserRequest } from "~/services/user/UserService"
import { axiosClient } from "~/services/http/HttpClient"
import { DateTime } from "luxon"

vi.mock("~/services/http/HttpClient", () => ({
  axiosClient: {
    post: vi.fn(),
  },
}))

const mockPost = vi.mocked(axiosClient.post)

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createUser", () => {
    const mockUserResponse = {
      id: "user-123",
      createdAt: "2024-01-15T10:30:00.000Z",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "User",
    }

    test("should call POST /users with request data", async () => {
      mockPost.mockResolvedValue({ data: mockUserResponse })

      const request: CreateUserRequest = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
      }

      await createUser(request)

      expect(mockPost).toHaveBeenCalledWith("/users", request)
    })

    test("should return parsed User object", async () => {
      mockPost.mockResolvedValue({ data: mockUserResponse })

      const request: CreateUserRequest = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
      }

      const result = await createUser(request)

      expect(result.id).toBe("user-123")
      expect(result.firstName).toBe("John")
      expect(result.lastName).toBe("Doe")
      expect(result.email).toBe("john@example.com")
      expect(result.role).toBe("User")
      expect(result.createdAt).toBeInstanceOf(DateTime)
    })

    test("should propagate errors from axios", async () => {
      const error = new Error("Network error")
      mockPost.mockRejectedValue(error)

      const request: CreateUserRequest = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
      }

      await expect(createUser(request)).rejects.toThrow("Network error")
    })
  })
})
