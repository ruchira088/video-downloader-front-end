import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { Some, None } from "~/types/Option"
import { SortBy } from "~/models/SortBy"
import { Ordering } from "~/models/Ordering"
import { SchedulingStatus } from "~/models/SchedulingStatus"
import { WorkerStatus } from "~/models/WorkerStatus"

// Mock ApiConfiguration
vi.mock("~/services/ApiConfiguration", () => ({
  configuration: {
    baseUrl: "http://test-api.example.com",
  },
}))

// Mock axios client
vi.mock("~/services/http/HttpClient", () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { axiosClient } from "~/services/http/HttpClient"
import {
  scheduleVideo,
  updateSchedulingStatus,
  retryFailedScheduledVideos,
  fetchWorkerStatus,
  updateWorkerStatus,
  deleteScheduledVideoById,
  fetchScheduledVideos,
  scheduledVideoDownloadStream,
} from "~/services/scheduling/SchedulingService"

const mockAxiosGet = vi.mocked(axiosClient.get)
const mockAxiosPost = vi.mocked(axiosClient.post)
const mockAxiosPut = vi.mocked(axiosClient.put)
const mockAxiosDelete = vi.mocked(axiosClient.delete)

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

const createMockScheduledDownload = (id: string, status: string = "Queued") => ({
  lastUpdatedAt: "2024-01-15T10:00:00+00:00",
  scheduledAt: "2024-01-15T09:00:00+00:00",
  videoMetadata: createMockVideoMetadata(id, "Test Video"),
  errorInfo: null,
  status,
  downloadedBytes: 0,
  completedAt: null,
})

describe("SchedulingService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("scheduleVideo", () => {
    test("should post URL and return scheduled download", async () => {
      mockAxiosPost.mockResolvedValue({ data: createMockScheduledDownload("video-123") })

      const result = await scheduleVideo("https://youtube.com/watch?v=abc123")

      expect(mockAxiosPost).toHaveBeenCalledWith("/schedule", {
        url: "https://youtube.com/watch?v=abc123",
      })
      expect(result.videoMetadata.id).toBe("video-123")
    })
  })

  describe("updateSchedulingStatus", () => {
    test("should update status and return updated download", async () => {
      mockAxiosPut.mockResolvedValue({ data: createMockScheduledDownload("video-123", "Paused") })

      const result = await updateSchedulingStatus("video-123", SchedulingStatus.Paused)

      expect(mockAxiosPut).toHaveBeenCalledWith("/schedule/id/video-123", {
        status: SchedulingStatus.Paused,
      })
      expect(result.status).toBe("Paused")
    })
  })

  describe("retryFailedScheduledVideos", () => {
    test("should post to retry endpoint and return updated downloads", async () => {
      const mockResults = {
        results: [
          createMockScheduledDownload("video-123"),
          createMockScheduledDownload("video-456"),
        ],
      }
      mockAxiosPost.mockResolvedValue({ data: mockResults })

      const result = await retryFailedScheduledVideos()

      expect(mockAxiosPost).toHaveBeenCalledWith("/schedule/retry-failed")
      expect(result).toHaveLength(2)
    })
  })

  describe("fetchWorkerStatus", () => {
    test("should return worker status", async () => {
      mockAxiosGet.mockResolvedValue({ data: { workerStatus: "Available" } })

      const result = await fetchWorkerStatus()

      expect(mockAxiosGet).toHaveBeenCalledWith("/schedule/worker-status")
      expect(result).toBe(WorkerStatus.Available)
    })
  })

  describe("updateWorkerStatus", () => {
    test("should update worker status", async () => {
      mockAxiosPut.mockResolvedValue({ data: { workerStatus: "Paused" } })

      const result = await updateWorkerStatus(WorkerStatus.Paused)

      expect(mockAxiosPut).toHaveBeenCalledWith("/schedule/worker-status", {
        workerStatus: WorkerStatus.Paused,
      })
      expect(result).toBe(WorkerStatus.Paused)
    })
  })

  describe("deleteScheduledVideoById", () => {
    test("should delete and return the deleted download", async () => {
      mockAxiosDelete.mockResolvedValue({ data: createMockScheduledDownload("video-123") })

      const result = await deleteScheduledVideoById("video-123")

      expect(mockAxiosDelete).toHaveBeenCalledWith("/schedule/id/video-123")
      expect(result.videoMetadata.id).toBe("video-123")
    })
  })

  describe("fetchScheduledVideos", () => {
    test("should fetch with correct parameters including search term", async () => {
      mockAxiosGet.mockResolvedValue({ data: { results: [createMockScheduledDownload("video-123")] } })

      const result = await fetchScheduledVideos(
        Some.of("test query"),
        0,
        20,
        SortBy.Date,
        Ordering.Descending
      )

      expect(mockAxiosGet).toHaveBeenCalledWith("/schedule/search?", {
        params: expect.objectContaining({
          "page-number": 0,
          "page-size": 20,
          "sort-by": SortBy.Date,
          order: Ordering.Descending,
          "search-term": "test query",
        }),
      })
      expect(result).toHaveLength(1)
    })

    test("should fetch with empty search term when None", async () => {
      mockAxiosGet.mockResolvedValue({ data: { results: [] } })

      await fetchScheduledVideos(
        None.of(),
        1,
        10,
        SortBy.Title,
        Ordering.Ascending
      )

      expect(mockAxiosGet).toHaveBeenCalledWith("/schedule/search?", {
        params: expect.objectContaining({
          "search-term": "",
        }),
      })
    })

    test("should include status filter with multiple statuses", async () => {
      mockAxiosGet.mockResolvedValue({ data: { results: [] } })

      await fetchScheduledVideos(
        None.of(),
        0,
        10,
        SortBy.Date,
        Ordering.Descending
      )

      const params = mockAxiosGet.mock.calls[0][1]?.params as Record<string, string>
      expect(params.status).toContain(SchedulingStatus.Active)
      expect(params.status).toContain(SchedulingStatus.Error)
      expect(params.status).toContain(SchedulingStatus.Queued)
      expect(params.status).toContain(SchedulingStatus.Paused)
    })
  })

  // Note: scheduledVideoDownloadStream uses EventSource which is difficult to mock
  // in jsdom. The function's HTTP-based functionality is tested via integration tests.
})
