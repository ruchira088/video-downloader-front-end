import { describe, expect, test, vi, beforeEach } from "vitest"
import { Duration } from "luxon"
import { Some, None } from "~/types/Option"
import { SortBy } from "~/models/SortBy"
import { Ordering } from "~/models/Ordering"

// Mock axios client
vi.mock("~/services/http/HttpClient", () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { axiosClient } from "~/services/http/HttpClient"
import {
  searchVideos,
  fetchVideoById,
  fetchVideoSnapshotsByVideoId,
  metadata,
  updateVideoTitle,
  videoServiceSummary,
  deleteVideo,
  scanForVideos,
  fetchVideoScanStatus,
} from "~/services/video/VideoService"

const mockAxiosGet = vi.mocked(axiosClient.get)
const mockAxiosPost = vi.mocked(axiosClient.post)
const mockAxiosPatch = vi.mocked(axiosClient.patch)
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
  watchTime: { length: 0, unit: "seconds" },
})

describe("VideoService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("searchVideos", () => {
    test("should call API with correct query parameters", async () => {
      const searchResult = {
        results: [createMockVideo("video-123", "Test Video")],
        pageNumber: 0,
        pageSize: 10,
        searchTerm: "test",
      }
      mockAxiosGet.mockResolvedValue({ data: searchResult })

      const abortController = new AbortController()
      const durationRange = {
        min: Duration.fromObject({ minutes: 0 }),
        max: None.of<Duration>(),
      }
      const sizeRange = { min: 0, max: None.of<number>() }

      await searchVideos(
        Some.of("test"),
        durationRange,
        sizeRange,
        ["youtube.com"],
        0,
        10,
        SortBy.Date,
        Ordering.Descending,
        abortController.signal
      )

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining("/videos/search?"),
        { signal: abortController.signal }
      )
      const callUrl = mockAxiosGet.mock.calls[0][0] as string
      expect(callUrl).toContain("page-number=0")
      expect(callUrl).toContain("page-size=10")
      expect(callUrl).toContain("sort-by=date")
      expect(callUrl).toContain("search-term=test")
      expect(callUrl).toContain("site=youtube.com")
    })

    test("should exclude search term when None", async () => {
      const searchResult = {
        results: [],
        pageNumber: 0,
        pageSize: 10,
        searchTerm: null,
      }
      mockAxiosGet.mockResolvedValue({ data: searchResult })

      const abortController = new AbortController()
      const durationRange = {
        min: Duration.fromObject({ minutes: 5 }),
        max: Some.of(Duration.fromObject({ minutes: 60 })),
      }
      const sizeRange = { min: 100, max: Some.of(5000) }

      await searchVideos(
        None.of(),
        durationRange,
        sizeRange,
        [],
        1,
        20,
        SortBy.Size,
        Ordering.Ascending,
        abortController.signal
      )

      const callUrl = mockAxiosGet.mock.calls[0][0] as string
      expect(callUrl).not.toContain("search-term=")
      expect(callUrl).not.toContain("site=")
    })

    test("should return parsed search result", async () => {
      const searchResult = {
        results: [createMockVideo("video-123", "Test Video")],
        pageNumber: 1,
        pageSize: 10,
        searchTerm: "query",
      }
      mockAxiosGet.mockResolvedValue({ data: searchResult })

      const abortController = new AbortController()
      const durationRange = {
        min: Duration.fromObject({ minutes: 0 }),
        max: None.of<Duration>(),
      }
      const sizeRange = { min: 0, max: None.of<number>() }

      const result = await searchVideos(
        Some.of("query"),
        durationRange,
        sizeRange,
        [],
        1,
        10,
        SortBy.Date,
        Ordering.Descending,
        abortController.signal
      )

      expect(result.results).toHaveLength(1)
      expect(result.pageNumber).toBe(1)
    })
  })

  describe("fetchVideoById", () => {
    test("should call API with video ID", async () => {
      mockAxiosGet.mockResolvedValue({ data: createMockVideo("video-123", "Test Video") })

      await fetchVideoById("video-123")

      expect(mockAxiosGet).toHaveBeenCalledWith("/videos/id/video-123")
    })

    test("should return parsed video", async () => {
      mockAxiosGet.mockResolvedValue({ data: createMockVideo("video-123", "Test Video") })

      const result = await fetchVideoById("video-123")

      expect(result.videoMetadata.id).toBe("video-123")
      expect(result.videoMetadata.title).toBe("Test Video")
    })
  })

  describe("fetchVideoSnapshotsByVideoId", () => {
    test("should call API and return snapshots", async () => {
      const mockSnapshots = {
        results: [
          {
            videoId: "video-123",
            fileResource: createMockFileResource("snap-1"),
            videoTimestamp: { length: 30, unit: "seconds" },
          },
        ],
      }
      mockAxiosGet.mockResolvedValue({ data: mockSnapshots })

      const result = await fetchVideoSnapshotsByVideoId("video-123")

      expect(mockAxiosGet).toHaveBeenCalledWith("/videos/id/video-123/snapshots")
      expect(result).toHaveLength(1)
      expect(result[0].videoId).toBe("video-123")
    })
  })

  describe("metadata", () => {
    test("should post URL and return video metadata", async () => {
      const mockMetadata = createMockVideoMetadata("meta-123", "New Video")
      mockAxiosPost.mockResolvedValue({ data: mockMetadata })

      const result = await metadata("https://youtube.com/watch?v=xyz")

      expect(mockAxiosPost).toHaveBeenCalledWith("/videos/metadata", {
        url: "https://youtube.com/watch?v=xyz",
      })
      expect(result.title).toBe("New Video")
    })
  })

  describe("updateVideoTitle", () => {
    test("should patch video title and return updated video", async () => {
      const updatedVideo = createMockVideo("video-123", "Updated Title")
      mockAxiosPatch.mockResolvedValue({ data: updatedVideo })

      const result = await updateVideoTitle("video-123", "Updated Title")

      expect(mockAxiosPatch).toHaveBeenCalledWith("/videos/id/video-123/metadata", {
        title: "Updated Title",
      })
      expect(result.videoMetadata.title).toBe("Updated Title")
    })
  })

  describe("videoServiceSummary", () => {
    test("should return video service summary", async () => {
      const mockSummary = {
        videoCount: 100,
        totalSize: 50000000000,
        totalDuration: { length: 360000, unit: "seconds" },
        sites: ["YouTube", "Vimeo"],
      }
      mockAxiosGet.mockResolvedValue({ data: mockSummary })

      const result = await videoServiceSummary()

      expect(mockAxiosGet).toHaveBeenCalledWith("/videos/summary")
      expect(result.videoCount).toBe(100)
    })
  })

  describe("deleteVideo", () => {
    test("should delete video without file", async () => {
      mockAxiosDelete.mockResolvedValue({ data: createMockVideo("video-123", "Test Video") })

      const result = await deleteVideo("video-123", false)

      expect(mockAxiosDelete).toHaveBeenCalledWith("/videos/id/video-123?delete-video-file=false")
      expect(result.videoMetadata.id).toBe("video-123")
    })

    test("should delete video with file", async () => {
      mockAxiosDelete.mockResolvedValue({ data: createMockVideo("video-123", "Test Video") })

      await deleteVideo("video-123", true)

      expect(mockAxiosDelete).toHaveBeenCalledWith("/videos/id/video-123?delete-video-file=true")
    })
  })

  describe("scanForVideos", () => {
    test("should post to scan endpoint", async () => {
      mockAxiosPost.mockResolvedValue({ data: {} })

      await scanForVideos()

      expect(mockAxiosPost).toHaveBeenCalledWith("/videos/scan")
    })
  })

  describe("fetchVideoScanStatus", () => {
    test("should return video scan status - Idle", async () => {
      const mockScanStatus = {
        updatedAt: "2024-01-15T10:00:00+00:00",
        scanStatus: "Idle",
      }
      mockAxiosGet.mockResolvedValue({ data: mockScanStatus })

      const result = await fetchVideoScanStatus()

      expect(mockAxiosGet).toHaveBeenCalledWith("/videos/scan")
      expect(result.scanStatus).toBe("Idle")
    })

    test("should return video scan status - InProgress", async () => {
      const mockScanStatus = {
        updatedAt: "2024-01-15T10:00:00+00:00",
        scanStatus: "InProgress",
      }
      mockAxiosGet.mockResolvedValue({ data: mockScanStatus })

      const result = await fetchVideoScanStatus()

      expect(result.scanStatus).toBe("InProgress")
    })

    test("should handle null updatedAt as Option", async () => {
      const mockScanStatus = {
        updatedAt: null,
        scanStatus: "Idle",
      }
      mockAxiosGet.mockResolvedValue({ data: mockScanStatus })

      const result = await fetchVideoScanStatus()

      // updatedAt uses ZodOptional which transforms to Option
      expect(result.scanStatus).toBe("Idle")
    })
  })
})
