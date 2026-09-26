import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

const mockPost = vi.fn()

vi.mock("axios", () => ({
  default: { create: vi.fn(() => ({ post: mockPost })) },
}))

import axios from "axios"

const mockCreate = vi.mocked(axios.create)

const enrolOn = async (host: string) => {
  vi.stubGlobal("window", { location: { host } })
  vi.resetModules()
  const { enrolInFallback } = await import("~/services/fallback/FallbackService")

  await enrolInFallback("me@ruchij.com", "password123")
}

describe("FallbackService", () => {
  beforeEach(() => {
    mockPost.mockResolvedValue({ status: 201 })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  describe("enrolInFallback", () => {
    test.each([
      ["videos.ruchij.com", "https://fallback-api.video.ruchij.com"],
      ["staging.videos.ruchij.com", "https://staging.fallback-api.video.ruchij.com"],
      ["my-branch.videos.ruchij.com", "https://staging.fallback-api.video.ruchij.com"],
    ])("should post the credentials to the fallback API for %s", async (host, fallbackApiUrl) => {
      await enrolOn(host)

      expect(mockCreate).toHaveBeenCalledWith({ baseURL: fallbackApiUrl, timeout: 15_000 })
      expect(mockPost).toHaveBeenCalledWith("/user", { email: "me@ruchij.com", password: "password123" })
    })

    test("should use VITE_FALLBACK_API_URL when it is set", async () => {
      vi.stubEnv("VITE_FALLBACK_API_URL", "http://localhost:8000")

      await enrolOn("localhost:5173")

      expect(mockCreate).toHaveBeenCalledWith({ baseURL: "http://localhost:8000", timeout: 15_000 })
      expect(mockPost).toHaveBeenCalledTimes(1)
    })

    test("should not call any fallback API in local development without VITE_FALLBACK_API_URL", async () => {
      vi.stubEnv("VITE_FALLBACK_API_URL", "")

      await enrolOn("localhost:5173")

      expect(mockCreate).not.toHaveBeenCalled()
      expect(mockPost).not.toHaveBeenCalled()
    })

    test("should never fail when the fallback API does", async () => {
      mockPost.mockRejectedValue(new Error("Network Error"))

      await expect(enrolOn("videos.ruchij.com")).resolves.toBeUndefined()
    })
  })
})
