import { describe, expect, test, vi, beforeEach } from "vitest"
import { DateTime } from "luxon"

// Mock axios client
vi.mock("~/services/http/HttpClient", () => ({
  axiosClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}))

import { axiosClient } from "~/services/http/HttpClient"
import {
  login,
  logout,
  getAuthenticatedUser,
  getAuthenticationToken,
  REDIRECT_QUERY_PARAMETER,
} from "~/services/authentication/AuthenticationService"

const mockAxiosPost = vi.mocked(axiosClient.post)
const mockAxiosGet = vi.mocked(axiosClient.get)
const mockAxiosDelete = vi.mocked(axiosClient.delete)

describe("AuthenticationService", () => {
  const mockTokenData = {
    secret: "test-secret-token",
    expiresAt: DateTime.now().plus({ days: 7 }).toISO(),
    issuedAt: DateTime.now().toISO(),
    renewals: 0,
  }

  const mockUserData = {
    id: "user-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    createdAt: "2024-01-15T10:00:00+00:00",
    role: "User",
  }

  const STORAGE_KEY = "Authentication-Token"

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe("REDIRECT_QUERY_PARAMETER", () => {
    test("should equal 'redirect'", () => {
      expect(REDIRECT_QUERY_PARAMETER).toBe("redirect")
    })
  })

  describe("login", () => {
    test("should call API with email and password", async () => {
      mockAxiosPost.mockResolvedValue({ data: mockTokenData })

      await login("test@example.com", "password123")

      expect(mockAxiosPost).toHaveBeenCalledWith("/authentication/login", {
        email: "test@example.com",
        password: "password123",
      })
    })

    test("should return parsed authentication token", async () => {
      mockAxiosPost.mockResolvedValue({ data: mockTokenData })

      const result = await login("test@example.com", "password123")

      expect(result.secret).toBe("test-secret-token")
      expect(result.renewals).toBe(0)
    })

    test("should throw on API error", async () => {
      mockAxiosPost.mockRejectedValue(new Error("Network error"))

      await expect(login("test@example.com", "password")).rejects.toThrow("Network error")
    })

    test("should persist the token without the secret", async () => {
      mockAxiosPost.mockResolvedValue({ data: mockTokenData })

      await login("test@example.com", "password123")

      const storedValue = JSON.parse(localStorage.getItem(STORAGE_KEY) as string)

      expect(storedValue).not.toHaveProperty("secret")
      expect(storedValue.renewals).toBe(0)
      expect(typeof storedValue.expiresAt).toBe("string")
      expect(typeof storedValue.issuedAt).toBe("string")
    })
  })

  describe("getAuthenticationToken", () => {
    test("should return None when no token is stored", () => {
      expect(getAuthenticationToken().isEmpty()).toBe(true)
    })

    test("should decode a stored token persisted by login", async () => {
      mockAxiosPost.mockResolvedValue({ data: mockTokenData })

      await login("test@example.com", "password123")

      const token = getAuthenticationToken().toNullable()

      expect(token).not.toBeNull()
      expect(token).not.toHaveProperty("secret")
      expect(token?.expiresAt.toISO()).toBe(mockTokenData.expiresAt)
      expect(token?.renewals).toBe(0)
    })

    test("should decode legacy stored tokens that still contain a secret", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTokenData))

      const token = getAuthenticationToken().toNullable()

      expect(token).not.toBeNull()
      expect(token).not.toHaveProperty("secret")
      expect(token?.expiresAt.toISO()).toBe(mockTokenData.expiresAt)
      expect(token?.renewals).toBe(0)
    })
  })

  describe("getAuthenticatedUser", () => {
    test("should call API to get user", async () => {
      mockAxiosGet.mockResolvedValue({ data: mockUserData })

      await getAuthenticatedUser()

      expect(mockAxiosGet).toHaveBeenCalledWith("/authentication/user")
    })

    test("should return parsed user", async () => {
      mockAxiosGet.mockResolvedValue({ data: mockUserData })

      const result = await getAuthenticatedUser()

      expect(result.email).toBe("test@example.com")
      expect(result.firstName).toBe("Test")
    })
  })

  describe("logout", () => {
    test("should call API to logout", async () => {
      mockAxiosDelete.mockResolvedValue({ data: mockUserData })

      await logout()

      expect(mockAxiosDelete).toHaveBeenCalledWith("authentication/logout")
    })

    test("should return the logged out user", async () => {
      mockAxiosDelete.mockResolvedValue({ data: mockUserData })

      const result = await logout()

      expect(result.email).toBe("test@example.com")
      expect(result.firstName).toBe("Test")
    })
  })
})
