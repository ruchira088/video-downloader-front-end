import { describe, expect, test, vi, beforeEach } from "vitest"
import { videoUrl, imageUrl } from "~/services/asset/AssetService"
import { FileResourceType } from "~/models/FileResource"

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
      const fileResource = {
        id: "video-123",
        type: FileResourceType.Video,
      }

      const result = videoUrl(fileResource)

      expect(result).toBe("https://api.example.com/assets/video/id/video-123")
    })

    test("should handle different video IDs", () => {
      const fileResource = {
        id: "abc-def-ghi",
        type: FileResourceType.Video,
      }

      const result = videoUrl(fileResource)

      expect(result).toBe("https://api.example.com/assets/video/id/abc-def-ghi")
    })
  })

  describe("imageUrl", () => {
    test("should generate direct asset URL when safeMode is false", () => {
      const fileResource = {
        id: "image-456",
        type: FileResourceType.Thumbnail,
      }

      const result = imageUrl(fileResource, false)

      expect(result).toBe("https://api.example.com/assets/thumbnail/id/image-456")
    })

    test("should use imageMappings when safeMode is true", () => {
      const fileResource = {
        id: "image-789",
        type: FileResourceType.Thumbnail,
      }

      const result = imageUrl(fileResource, true)

      expect(result).toBe("/safe-images/image-789.jpg")
    })

    test("should handle Snapshot type", () => {
      const fileResource = {
        id: "snapshot-001",
        type: FileResourceType.Snapshot,
      }

      const result = imageUrl(fileResource, false)

      expect(result).toBe("https://api.example.com/assets/snapshot/id/snapshot-001")
    })

    test("should handle safeMode toggle", () => {
      const fileResource = {
        id: "test-image",
        type: FileResourceType.Thumbnail,
      }

      const normalUrl = imageUrl(fileResource, false)
      const safeUrl = imageUrl(fileResource, true)

      expect(normalUrl).toBe("https://api.example.com/assets/thumbnail/id/test-image")
      expect(safeUrl).toBe("/safe-images/test-image.jpg")
    })
  })
})
