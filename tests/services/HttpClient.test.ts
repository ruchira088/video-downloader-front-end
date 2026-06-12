import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"

// Mock the ApiConfiguration before importing HttpClient
vi.mock("~/services/ApiConfiguration", () => ({
  apiConfiguration: {
    baseUrl: "http://test-api.example.com",
  },
}))

// Mock the AuthenticationService
const mockRemoveAuthenticationToken = vi.fn()
vi.mock("~/services/authentication/AuthenticationService", () => ({
  removeAuthenticationToken: () => mockRemoveAuthenticationToken(),
}))

describe("HttpClient", () => {
  const originalLocation = window.location
  const mockLocationAssign = vi.fn()

  const stubLocation = (pathname: string, search: string = "") => {
    Object.defineProperty(window, "location", {
      value: { pathname, search, assign: mockLocationAssign },
      writable: true,
      configurable: true,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    stubLocation("/")
  })

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
    vi.resetModules()
  })

  describe("axiosClient configuration", () => {
    test("should create axios instance with correct base URL", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")
      expect(axiosClient.defaults.baseURL).toBe("http://test-api.example.com")
    })

    test("should create axios instance with withCredentials set to true", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")
      expect(axiosClient.defaults.withCredentials).toBe(true)
    })
  })

  describe("response interceptor", () => {
    test("should pass through successful responses", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")

      // Get the response interceptor handlers
      const interceptors = (axiosClient.interceptors.response as any).handlers
      expect(interceptors.length).toBeGreaterThan(0)

      const interceptor = interceptors[0]
      const mockResponse = { data: { message: "success" }, status: 200 }

      const result = await interceptor.fulfilled(mockResponse)
      expect(result).toEqual(mockResponse)
    })

    test("should remove authentication token on 401 error, redirect to sign-in and reject", async () => {
      stubLocation("/history", "?page=2")
      const { axiosClient } = await import("~/services/http/HttpClient")

      const interceptors = (axiosClient.interceptors.response as any).handlers
      const interceptor = interceptors[0]

      const error401 = {
        response: { status: 401 },
        message: "Unauthorized",
      }

      // The interceptor should remove auth token, redirect and reject
      await expect(interceptor.rejected(error401)).rejects.toEqual(error401)
      expect(mockRemoveAuthenticationToken).toHaveBeenCalledTimes(1)
      expect(mockLocationAssign).toHaveBeenCalledTimes(1)
      expect(mockLocationAssign).toHaveBeenCalledWith("/sign-in?redirect=" + encodeURIComponent("/history?page=2"))
    })

    test("should not redirect on 401 error when already on the sign-in page", async () => {
      stubLocation("/sign-in")
      const { axiosClient } = await import("~/services/http/HttpClient")

      const interceptors = (axiosClient.interceptors.response as any).handlers
      const interceptor = interceptors[0]

      const error401 = {
        response: { status: 401 },
        message: "Unauthorized",
      }

      await expect(interceptor.rejected(error401)).rejects.toEqual(error401)
      expect(mockRemoveAuthenticationToken).toHaveBeenCalledTimes(1)
      expect(mockLocationAssign).not.toHaveBeenCalled()
    })

    test("should not redirect on 401 error when already on the sign-up page", async () => {
      stubLocation("/sign-up")
      const { axiosClient } = await import("~/services/http/HttpClient")

      const interceptors = (axiosClient.interceptors.response as any).handlers
      const interceptor = interceptors[0]

      const error401 = {
        response: { status: 401 },
        message: "Unauthorized",
      }

      await expect(interceptor.rejected(error401)).rejects.toEqual(error401)
      expect(mockRemoveAuthenticationToken).toHaveBeenCalledTimes(1)
      expect(mockLocationAssign).not.toHaveBeenCalled()
    })

    test("should reject non-401 errors", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")

      const interceptors = (axiosClient.interceptors.response as any).handlers
      const interceptor = interceptors[0]

      const error500 = {
        response: { status: 500 },
        message: "Internal Server Error",
      }

      await expect(interceptor.rejected(error500)).rejects.toEqual(error500)
      expect(mockRemoveAuthenticationToken).not.toHaveBeenCalled()
      expect(mockLocationAssign).not.toHaveBeenCalled()
    })

    test("should reject errors without response status", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")

      const interceptors = (axiosClient.interceptors.response as any).handlers
      const interceptor = interceptors[0]

      const networkError = {
        message: "Network Error",
      }

      await expect(interceptor.rejected(networkError)).rejects.toEqual(networkError)
      expect(mockRemoveAuthenticationToken).not.toHaveBeenCalled()
    })

    test("should reject errors with undefined response", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")

      const interceptors = (axiosClient.interceptors.response as any).handlers
      const interceptor = interceptors[0]

      const errorNoResponse = {
        response: undefined,
        message: "Request failed",
      }

      await expect(interceptor.rejected(errorNoResponse)).rejects.toEqual(errorNoResponse)
      expect(mockRemoveAuthenticationToken).not.toHaveBeenCalled()
    })
  })
})
