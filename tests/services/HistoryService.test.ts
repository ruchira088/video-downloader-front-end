import { describe, expect, test, vi, beforeEach } from "vitest"

// Mock axios client
vi.mock("~/services/http/HttpClient", () => ({
  axiosClient: {
    get: vi.fn(),
  },
}))

import { axiosClient } from "~/services/http/HttpClient"
import { getVideoHistory } from "~/services/history/HistoryService"
import { videoWatchHistoryJson } from "../fixtures"

const mockAxiosGet = vi.mocked(axiosClient.get)

describe("HistoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getVideoHistory", () => {
    test("should call API with correct pagination parameters", async () => {
      const mockHistory = {
        results: [],
      }
      mockAxiosGet.mockResolvedValue({ data: mockHistory })

      await getVideoHistory(0, 20)

      expect(mockAxiosGet).toHaveBeenCalledWith("/videos/history", {
        params: {
          "page-number": 0,
          "page-size": 20,
        },
      })
    })

    test("should return parsed video watch history", async () => {
      const mockHistory = {
        results: [
          videoWatchHistoryJson({ id: "history-1", videoId: "video-123", title: "Test Video" }),
          videoWatchHistoryJson({ id: "history-2", videoId: "video-456", title: "Another Video" }),
        ],
      }
      mockAxiosGet.mockResolvedValue({ data: mockHistory })

      const result = await getVideoHistory(1, 10)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("history-1")
      expect(result[1].id).toBe("history-2")
    })

    test("should return empty array when no history", async () => {
      const mockHistory = {
        results: [],
      }
      mockAxiosGet.mockResolvedValue({ data: mockHistory })

      const result = await getVideoHistory(0, 10)

      expect(result).toEqual([])
    })

    test("should throw on API error", async () => {
      mockAxiosGet.mockRejectedValue(new Error("Network error"))

      await expect(getVideoHistory(0, 10)).rejects.toThrow("Network error")
    })

    test("should use different pagination values", async () => {
      const mockHistory = { results: [] }
      mockAxiosGet.mockResolvedValue({ data: mockHistory })

      await getVideoHistory(5, 50)

      expect(mockAxiosGet).toHaveBeenCalledWith("/videos/history", {
        params: {
          "page-number": 5,
          "page-size": 50,
        },
      })
    })
  })
})
