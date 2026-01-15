import { describe, expect, test } from "vitest"
import { BackendServiceInformation } from "~/models/BackendServiceInformation"
import { DateTime } from "luxon"

describe("BackendServiceInformation", () => {
  test("should parse valid backend service information", () => {
    const data = {
      serviceName: "video-downloader-backend",
      organization: "ruchij",
      scalaVersion: "3.3.0",
      sbtVersion: "1.9.0",
      javaVersion: "17",
      "yt-dlpVersion": "2023.10.13",
      currentTimestamp: "2023-10-15T10:30:00Z",
      gitBranch: "main",
      gitCommit: "abc123",
      buildTimestamp: "2023-10-15T09:00:00Z",
    }

    const result = BackendServiceInformation.parse(data)

    expect(result.serviceName).toBe("video-downloader-backend")
    expect(result.organization).toBe("ruchij")
    expect(result.scalaVersion).toBe("3.3.0")
    expect(result.sbtVersion).toBe("1.9.0")
    expect(result.javaVersion).toBe("17")
    expect(result.ytDlpVersion).toBe("2023.10.13")
    expect(result.currentTimestamp).toBeInstanceOf(DateTime)
  })

  test("should transform yt-dlpVersion to ytDlpVersion", () => {
    const data = {
      serviceName: "backend",
      organization: "org",
      scalaVersion: "3.0",
      sbtVersion: "1.0",
      javaVersion: "11",
      "yt-dlpVersion": "2023.01.01",
      currentTimestamp: "2023-01-01T00:00:00Z",
    }

    const result = BackendServiceInformation.parse(data)

    expect(result.ytDlpVersion).toBe("2023.01.01")
    expect((result as any)["yt-dlpVersion"]).toBeUndefined()
  })

  test("should handle optional fields as None", () => {
    const data = {
      serviceName: "backend",
      organization: "org",
      scalaVersion: "3.0",
      sbtVersion: "1.0",
      javaVersion: "11",
      "yt-dlpVersion": "2023.01.01",
      currentTimestamp: "2023-01-01T00:00:00Z",
    }

    const result = BackendServiceInformation.parse(data)

    expect(result.gitBranch.isEmpty()).toBe(true)
    expect(result.gitCommit.isEmpty()).toBe(true)
    expect(result.buildTimestamp.isEmpty()).toBe(true)
  })

  test("should parse optional fields when provided", () => {
    const data = {
      serviceName: "backend",
      organization: "org",
      scalaVersion: "3.0",
      sbtVersion: "1.0",
      javaVersion: "11",
      "yt-dlpVersion": "2023.01.01",
      currentTimestamp: "2023-01-01T00:00:00Z",
      gitBranch: "feature-branch",
      gitCommit: "def456",
      buildTimestamp: "2023-01-01T10:00:00Z",
    }

    const result = BackendServiceInformation.parse(data)

    expect(result.gitBranch.isEmpty()).toBe(false)
    expect(result.gitCommit.isEmpty()).toBe(false)
    expect(result.buildTimestamp.isEmpty()).toBe(false)
  })

  test("should throw on missing required fields", () => {
    const data = {
      serviceName: "backend",
      // missing other required fields
    }

    expect(() => BackendServiceInformation.parse(data)).toThrow()
  })
})
