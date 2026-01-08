import { describe, expect, test, vi, beforeEach } from "vitest"

// Mock axios client
vi.mock("~/services/http/HttpClient", () => ({
  axiosClient: {
    get: vi.fn(),
  },
}))

import { axiosClient } from "~/services/http/HttpClient"
import { getVideoHistory } from "~/services/history/HistoryService"

const mockAxiosGet = vi.mocked(axiosClient.get)

// Helper to create valid mock data matching Zod schemas
const createMockFileResource = (id: string) => ({
  id,
  createdAt: "2024-01-15T10:00:00+00:00",
  path: `/files/${id}`,
  mediaType: "image/jpeg",
  size: 50000,
})

const createMockVideoMetadata = (id: string, title: string) => ({
  url: `https://youtube.com/watch?v=${id}`,
  id,
  videoSite: "YouTube",
  title,
  duration: { length: 300, unit: "seconds" },
  size: 1000000,
  thumbnail: createMockFileResource(`thumb-${id}`),
})

const createMockVideo = (id: string, title: string) => ({
  videoMetadata: createMockVideoMetadata(id, title),
  fileResource: {
    id: `file-${id}`,
    createdAt: "2024-01-15T10:00:00+00:00",
    path: `/videos/${id}.mp4`,
    mediaType: "video/mp4",
    size: 1000000,
  },
  createdAt: "2024-01-15T10:00:00+00:00",
  watchTime: { length: 150, unit: "seconds" },
})

const createMockVideoWatchHistory = (id: string, videoId: string, title: string) => ({
  id,
  duration: { length: 150, unit: "seconds" },
  userId: "user-123",
  createdAt: "2024-01-15T10:00:00+00:00",
  lastUpdatedAt: "2024-01-15T10:05:00+00:00",
  video: createMockVideo(videoId, title),
})

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

      expect(mockAxiosGet).toHaveBeenCalledWith("/videos/history?page-number=0&page-size=20")
    })

    test("should return parsed video watch history", async () => {
      const mockHistory = {
        results: [
          createMockVideoWatchHistory("history-1", "video-123", "Test Video"),
          createMockVideoWatchHistory("history-2", "video-456", "Another Video"),
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

      expect(mockAxiosGet).toHaveBeenCalledWith("/videos/history?page-number=5&page-size=50")
    })
  })
})
