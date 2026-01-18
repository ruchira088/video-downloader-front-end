import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { Some, None } from "~/types/Option"
import { SortBy } from "~/models/SortBy"
import { Ordering } from "~/models/Ordering"
import { SchedulingStatus } from "~/models/SchedulingStatus"
import { WorkerStatus } from "~/models/WorkerStatus"
import { EventStreamEventType } from "~/pages/authenticated/downloading/EventStreamEventType"

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

// Mock EventSource
let mockEventSourceInstance: {
  url: string
  withCredentials: boolean
  listeners: Map<string, ((event: MessageEvent) => void)[]>
  close: ReturnType<typeof vi.fn>
  addEventListener: (type: string, listener: (event: MessageEvent) => void) => void
  removeEventListener: (type: string, listener: (event: MessageEvent) => void) => void
  simulateMessage: (type: string, data: unknown) => void
} | null = null

const createMockEventSource = () => {
  const listeners = new Map<string, ((event: MessageEvent) => void)[]>()
  return {
    url: "",
    withCredentials: false,
    listeners,
    close: vi.fn(),
    addEventListener(type: string, listener: (event: MessageEvent) => void) {
      if (!listeners.has(type)) {
        listeners.set(type, [])
      }
      listeners.get(type)!.push(listener)
    },
    removeEventListener(type: string, listener: (event: MessageEvent) => void) {
      const typeListeners = listeners.get(type)
      if (typeListeners) {
        const index = typeListeners.indexOf(listener)
        if (index > -1) {
          typeListeners.splice(index, 1)
        }
      }
    },
    simulateMessage(type: string, data: unknown) {
      const typeListeners = listeners.get(type) || []
      const event = { data: JSON.stringify(data) } as MessageEvent
      typeListeners.forEach(l => l(event))
    }
  }
}

const originalEventSource = globalThis.EventSource

beforeEach(() => {
  mockEventSourceInstance = null
  // Create a constructor function that returns our mock
  const MockEventSourceConstructor = function(this: unknown, url: string, options?: { withCredentials?: boolean }) {
    mockEventSourceInstance = createMockEventSource()
    mockEventSourceInstance.url = url
    mockEventSourceInstance.withCredentials = options?.withCredentials ?? false
    return mockEventSourceInstance
  } as unknown as typeof EventSource

  globalThis.EventSource = MockEventSourceConstructor
})

afterEach(() => {
  globalThis.EventSource = originalEventSource
})

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

  describe("scheduledVideoDownloadStream", () => {
    test("should create EventSource with correct URL and credentials", () => {
      const onProgress = vi.fn()
      const onUpdate = vi.fn()

      scheduledVideoDownloadStream(onProgress, onUpdate)

      expect(mockEventSourceInstance).not.toBeNull()
      expect(mockEventSourceInstance!.url).toBe("http://test-api.example.com/schedule/updates")
      expect(mockEventSourceInstance!.withCredentials).toBe(true)
    })

    test("should call onDownloadProgress when receiving ACTIVE_DOWNLOAD event", () => {
      const onProgress = vi.fn()
      const onUpdate = vi.fn()

      scheduledVideoDownloadStream(onProgress, onUpdate)

      const mockProgressData = {
        videoId: "video-123",
        updatedAt: "2024-01-15T10:00:00+00:00",
        bytes: 1000,
      }

      mockEventSourceInstance!.simulateMessage(EventStreamEventType.ACTIVE_DOWNLOAD, mockProgressData)

      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
        videoId: "video-123",
        bytes: 1000,
      }))
    })

    test("should call onScheduledVideoDownloadUpdate when receiving SCHEDULED_VIDEO_DOWNLOAD_UPDATE event", () => {
      const onProgress = vi.fn()
      const onUpdate = vi.fn()

      scheduledVideoDownloadStream(onProgress, onUpdate)

      const mockUpdateData = createMockScheduledDownload("video-456", "Queued")

      mockEventSourceInstance!.simulateMessage(EventStreamEventType.SCHEDULED_VIDEO_DOWNLOAD_UPDATE, mockUpdateData)

      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
        videoMetadata: expect.objectContaining({
          id: "video-456"
        })
      }))
    })

    test("should return cleanup function that removes listeners and closes connection", () => {
      const onProgress = vi.fn()
      const onUpdate = vi.fn()

      const cleanup = scheduledVideoDownloadStream(onProgress, onUpdate)

      // Store initial listener counts
      const initialActiveDownloadListeners = mockEventSourceInstance!.listeners.get(EventStreamEventType.ACTIVE_DOWNLOAD)?.length ?? 0
      const initialUpdateListeners = mockEventSourceInstance!.listeners.get(EventStreamEventType.SCHEDULED_VIDEO_DOWNLOAD_UPDATE)?.length ?? 0

      expect(initialActiveDownloadListeners).toBe(1)
      expect(initialUpdateListeners).toBe(1)

      // Call cleanup
      cleanup()

      // Verify close was called
      expect(mockEventSourceInstance!.close).toHaveBeenCalled()

      // Verify listeners were removed
      expect(mockEventSourceInstance!.listeners.get(EventStreamEventType.ACTIVE_DOWNLOAD)?.length ?? 0).toBe(0)
      expect(mockEventSourceInstance!.listeners.get(EventStreamEventType.SCHEDULED_VIDEO_DOWNLOAD_UPDATE)?.length ?? 0).toBe(0)
    })

    test("should not call handlers after cleanup", () => {
      const onProgress = vi.fn()
      const onUpdate = vi.fn()

      const cleanup = scheduledVideoDownloadStream(onProgress, onUpdate)
      cleanup()

      // Simulate messages after cleanup - handlers should not be called since listeners were removed
      const mockProgressData = {
        videoId: "video-123",
        updatedAt: "2024-01-15T10:00:00+00:00",
        bytes: 1000,
      }

      mockEventSourceInstance!.simulateMessage(EventStreamEventType.ACTIVE_DOWNLOAD, mockProgressData)

      expect(onProgress).not.toHaveBeenCalled()
    })
  })
})
