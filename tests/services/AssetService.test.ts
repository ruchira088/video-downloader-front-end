import { describe, expect, test, vi, beforeEach } from "vitest"
import { videoUrl, imageUrl } from "~/services/asset/AssetService"
import { type FileResource, FileResourceType } from "~/models/FileResource"
import { DateTime } from "luxon"

const createFileResource = <T extends FileResourceType>(id: string, type: T): FileResource<T> => ({
  id,
  type,
  createdAt: DateTime.now(),
  path: `/path/to/${id}`,
  mediaType: type === FileResourceType.Video ? "video/mp4" : "image/jpeg",
  size: 1024,
})

// Mock the dependencies
vi.mock("~/services/ApiConfiguration", () => ({
  configuration: {
    baseUrl: "https://api.example.com",
  },
}))

vi.mock("~/services/sanitize/SanitizationService", () => ({
  imageMappings: vi.fn((key: string) => `/safe-images/${key}.jpg`),
}))

describe("AssetService", () => {
  describe("videoUrl", () => {
    test("should generate correct video URL", () => {
      const fileResource = createFileResource("video-123", FileResourceType.Video)

      const result = videoUrl(fileResource)

      expect(result).toBe("https://api.example.com/assets/video/id/video-123")
    })

    test("should handle different video IDs", () => {
      const fileResource = createFileResource("abc-def-ghi", FileResourceType.Video)

      const result = videoUrl(fileResource)

      expect(result).toBe("https://api.example.com/assets/video/id/abc-def-ghi")
    })
  })

  describe("imageUrl", () => {
    test("should generate direct asset URL when safeMode is false", () => {
      const fileResource = createFileResource("image-456", FileResourceType.Thumbnail)

      const result = imageUrl(fileResource, false)

      expect(result).toBe("https://api.example.com/assets/thumbnail/id/image-456")
    })

    test("should use imageMappings when safeMode is true", () => {
      const fileResource = createFileResource("image-789", FileResourceType.Thumbnail)

      const result = imageUrl(fileResource, true)

      expect(result).toBe("/safe-images/image-789.jpg")
    })

    test("should handle Snapshot type", () => {
      const fileResource = createFileResource("snapshot-001", FileResourceType.Snapshot)

      const result = imageUrl(fileResource, false)

      expect(result).toBe("https://api.example.com/assets/snapshot/id/snapshot-001")
    })

    test("should handle safeMode toggle", () => {
      const fileResource = createFileResource("test-image", FileResourceType.Thumbnail)

      const normalUrl = imageUrl(fileResource, false)
      const safeUrl = imageUrl(fileResource, true)

      expect(normalUrl).toBe("https://api.example.com/assets/thumbnail/id/test-image")
      expect(safeUrl).toBe("/safe-images/test-image.jpg")
    })
  })
})
