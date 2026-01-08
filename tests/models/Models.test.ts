import { describe, expect, test } from "vitest"
import { DateTime } from "luxon"
import { AuthenticationToken } from "~/models/AuthenticationToken"
import { User } from "~/models/User"
import { ApplicationConfiguration, Theme } from "~/models/ApplicationConfiguration"
import { FileResource, FileResourceType } from "~/models/FileResource"
import { Some, None } from "~/types/Option"

describe("AuthenticationToken", () => {
  const validToken = {
    secret: "abc123secret",
    expiresAt: "2024-12-31T23:59:59Z",
    issuedAt: "2024-01-01T00:00:00Z",
    renewals: 3,
  }

  test("should parse valid authentication token", () => {
    const result = AuthenticationToken.parse(validToken)

    expect(result.secret).toBe("abc123secret")
    expect(result.expiresAt).toBeInstanceOf(DateTime)
    expect(result.issuedAt).toBeInstanceOf(DateTime)
    expect(result.renewals).toBe(3)
  })

  test("should reject token with missing secret", () => {
    const invalid = { ...validToken, secret: undefined }
    expect(() => AuthenticationToken.parse(invalid)).toThrow()
  })

  test("should reject token with invalid expiresAt", () => {
    const invalid = { ...validToken, expiresAt: "not a date" }
    expect(() => AuthenticationToken.parse(invalid)).toThrow()
  })

  test("should reject token with invalid issuedAt", () => {
    const invalid = { ...validToken, issuedAt: "not a date" }
    expect(() => AuthenticationToken.parse(invalid)).toThrow()
  })

  test("should reject token with non-number renewals", () => {
    const invalid = { ...validToken, renewals: "not a number" }
    expect(() => AuthenticationToken.parse(invalid)).toThrow()
  })

  test("should parse dates correctly", () => {
    const result = AuthenticationToken.parse(validToken)

    // Note: Luxon converts to local timezone, so we check UTC values
    expect(result.expiresAt.toUTC().year).toBe(2024)
    expect(result.expiresAt.toUTC().month).toBe(12)
    expect(result.expiresAt.toUTC().day).toBe(31)

    expect(result.issuedAt.toUTC().year).toBe(2024)
    expect(result.issuedAt.toUTC().month).toBe(1)
    expect(result.issuedAt.toUTC().day).toBe(1)
  })
})

describe("User", () => {
  const validUser = {
    id: "user-123",
    createdAt: "2024-01-15T10:30:00Z",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: "User",
  }

  test("should parse valid user", () => {
    const result = User.parse(validUser)

    expect(result.id).toBe("user-123")
    expect(result.firstName).toBe("John")
    expect(result.lastName).toBe("Doe")
    expect(result.email).toBe("john.doe@example.com")
    expect(result.role).toBe("User")
    expect(result.createdAt).toBeInstanceOf(DateTime)
  })

  test("should parse admin user", () => {
    const adminUser = { ...validUser, role: "Admin" }
    const result = User.parse(adminUser)

    expect(result.role).toBe("Admin")
  })

  test("should reject invalid role", () => {
    const invalid = { ...validUser, role: "SuperAdmin" }
    expect(() => User.parse(invalid)).toThrow()
  })

  test("should reject invalid email", () => {
    const invalid = { ...validUser, email: "not-an-email" }
    expect(() => User.parse(invalid)).toThrow()
  })

  test("should reject missing firstName", () => {
    const invalid = { ...validUser, firstName: undefined }
    expect(() => User.parse(invalid)).toThrow()
  })

  test("should reject missing lastName", () => {
    const invalid = { ...validUser, lastName: undefined }
    expect(() => User.parse(invalid)).toThrow()
  })
})

describe("ApplicationConfiguration", () => {
  test("should parse valid configuration with light theme", () => {
    const config = { safeMode: true, theme: "light" }
    const result = ApplicationConfiguration.parse(config)

    expect(result.safeMode).toBe(true)
    expect(result.theme).toBe(Theme.Light)
  })

  test("should parse valid configuration with dark theme", () => {
    const config = { safeMode: false, theme: "dark" }
    const result = ApplicationConfiguration.parse(config)

    expect(result.safeMode).toBe(false)
    expect(result.theme).toBe(Theme.Dark)
  })

  test("should use default value for safeMode when not provided", () => {
    const config = { theme: "light" }
    const result = ApplicationConfiguration.parse(config)

    expect(result.safeMode).toBe(false)
  })

  test("should reject invalid theme", () => {
    const invalid = { safeMode: false, theme: "blue" }
    expect(() => ApplicationConfiguration.parse(invalid)).toThrow()
  })

  test("should reject missing theme", () => {
    const invalid = { safeMode: false }
    expect(() => ApplicationConfiguration.parse(invalid)).toThrow()
  })

  test("should reject non-boolean safeMode", () => {
    const invalid = { safeMode: "yes", theme: "light" }
    expect(() => ApplicationConfiguration.parse(invalid)).toThrow()
  })
})

describe("FileResource", () => {
  const validFileResource = {
    id: "file-123",
    createdAt: "2024-06-15T14:30:00Z",
    path: "/videos/video-001.mp4",
    mediaType: "video/mp4",
    size: 1024000,
  }

  describe("with Video type", () => {
    const VideoFileResource = FileResource(FileResourceType.Video)

    test("should parse valid video file resource", () => {
      const result = VideoFileResource.parse(validFileResource)

      expect(result.id).toBe("file-123")
      expect(result.path).toBe("/videos/video-001.mp4")
      expect(result.mediaType).toBe("video/mp4")
      expect(result.size).toBe(1024000)
      expect(result.type).toBe(FileResourceType.Video)
      expect(result.createdAt).toBeInstanceOf(DateTime)
    })

    test("should add Video type to parsed result", () => {
      const result = VideoFileResource.parse(validFileResource)
      expect(result.type).toBe("video")
    })
  })

  describe("with Thumbnail type", () => {
    const ThumbnailFileResource = FileResource(FileResourceType.Thumbnail)

    test("should parse valid thumbnail file resource", () => {
      const thumbnailData = {
        ...validFileResource,
        path: "/thumbnails/thumb-001.jpg",
        mediaType: "image/jpeg",
      }
      const result = ThumbnailFileResource.parse(thumbnailData)

      expect(result.type).toBe(FileResourceType.Thumbnail)
      expect(result.type).toBe("thumbnail")
    })
  })

  describe("with Snapshot type", () => {
    const SnapshotFileResource = FileResource(FileResourceType.Snapshot)

    test("should parse valid snapshot file resource", () => {
      const snapshotData = {
        ...validFileResource,
        path: "/snapshots/snap-001.png",
        mediaType: "image/png",
      }
      const result = SnapshotFileResource.parse(snapshotData)

      expect(result.type).toBe(FileResourceType.Snapshot)
      expect(result.type).toBe("snapshot")
    })
  })

  describe("validation", () => {
    const VideoFileResource = FileResource(FileResourceType.Video)

    test("should reject missing id", () => {
      const invalid = { ...validFileResource, id: undefined }
      expect(() => VideoFileResource.parse(invalid)).toThrow()
    })

    test("should reject missing path", () => {
      const invalid = { ...validFileResource, path: undefined }
      expect(() => VideoFileResource.parse(invalid)).toThrow()
    })

    test("should reject non-number size", () => {
      const invalid = { ...validFileResource, size: "1024" }
      expect(() => VideoFileResource.parse(invalid)).toThrow()
    })

    test("should reject invalid createdAt", () => {
      const invalid = { ...validFileResource, createdAt: "not a date" }
      expect(() => VideoFileResource.parse(invalid)).toThrow()
    })
  })
})

describe("Theme enum", () => {
  test("should have correct values", () => {
    expect(Theme.Light).toBe("light")
    expect(Theme.Dark).toBe("dark")
  })

  test("should be usable in configuration", () => {
    const lightConfig = ApplicationConfiguration.parse({
      theme: Theme.Light,
      safeMode: false,
    })
    expect(lightConfig.theme).toBe("light")

    const darkConfig = ApplicationConfiguration.parse({
      theme: Theme.Dark,
      safeMode: true,
    })
    expect(darkConfig.theme).toBe("dark")
  })
})

describe("FileResourceType enum", () => {
  test("should have correct values", () => {
    expect(FileResourceType.Video).toBe("video")
    expect(FileResourceType.Thumbnail).toBe("thumbnail")
    expect(FileResourceType.Snapshot).toBe("snapshot")
  })
})
