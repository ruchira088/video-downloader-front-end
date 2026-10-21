import { describe, expect, test, vi, beforeEach } from "vitest"
import { DateTime } from "luxon"

// Mock axios client
vi.mock("~/services/http/HttpClient", () => ({
  axiosClient: {
    get: vi.fn(),
  },
}))

import { axiosClient } from "~/services/http/HttpClient"
import {
  retrieveBackendServiceInformation,
  performHealthCheck,
  frontendServiceInformation,
} from "~/services/health/HealthCheckService"

const mockAxiosGet = vi.mocked(axiosClient.get)

describe("HealthCheckService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("retrieveBackendServiceInformation", () => {
    test("should call API and return backend service information", async () => {
      const mockData = {
        serviceName: "video-downloader-api",
        organization: "ruchij",
        javaVersion: "21",
        sbtVersion: "1.10.0",
        scalaVersion: "3.5.0",
        "yt-dlpVersion": "2024.01.15",
        currentTimestamp: "2024-01-15T12:00:00+00:00",
        gitBranch: "main",
        gitCommit: "abc123",
        buildTimestamp: "2024-01-15T10:30:00+00:00",
      }

      mockAxiosGet.mockResolvedValue({ data: mockData })

      const result = await retrieveBackendServiceInformation()

      expect(mockAxiosGet).toHaveBeenCalledWith("/service/info")
      expect(result.serviceName).toBe("video-downloader-api")
      expect(result.ytDlpVersion).toBe("2024.01.15")
    })

    test("should throw on API error", async () => {
      mockAxiosGet.mockRejectedValue(new Error("Service unavailable"))

      await expect(retrieveBackendServiceInformation()).rejects.toThrow("Service unavailable")
    })
  })

  describe("performHealthCheck", () => {
    const validHealthCheckData = {
      database: { durationInMs: 100, healthStatus: "Healthy" },
      fileRepository: {
        imageFolder: {
          filePath: "/images",
          healthStatusDetails: { durationInMs: 50, healthStatus: "Healthy" },
        },
        videoFolder: {
          filePath: "/videos",
          healthStatusDetails: { durationInMs: 75, healthStatus: "Healthy" },
        },
        otherVideoFolders: null,
      },
      keyValueStore: { durationInMs: 25, healthStatus: "Healthy" },
      pubSub: { durationInMs: 30, healthStatus: "Healthy" },
      spaRenderer: { durationInMs: 200, healthStatus: "Healthy" },
      internetConnectivity: { durationInMs: 150, healthStatus: "Healthy" },
    }

    test("should call API with validateStatus and return health check", async () => {
      mockAxiosGet.mockResolvedValue({ data: validHealthCheckData })

      const result = await performHealthCheck()

      expect(mockAxiosGet).toHaveBeenCalledWith("/service/health", { validateStatus: expect.any(Function) })
      expect(result.database.healthStatus).toBe("Healthy")
    })

    test("should accept any status code except 401 via validateStatus", async () => {
      mockAxiosGet.mockResolvedValue({ data: validHealthCheckData })

      await performHealthCheck()

      const call = mockAxiosGet.mock.calls[0]
      const config = call[1] as { validateStatus: (status: number) => boolean }

      // An unhealthy service still answers with a health report, whatever the status
      expect(config.validateStatus(200)).toBe(true)
      expect(config.validateStatus(500)).toBe(true)
      expect(config.validateStatus(503)).toBe(true)
      // ...but an expired session must reject, so the shared client's 401 handling signs the user out
      expect(config.validateStatus(401)).toBe(false)
    })
  })

  describe("frontendServiceInformation", () => {
    test("should return frontend service info with name and version from package.json", () => {
      const mockEnv = {} as ImportMetaEnv

      const result = frontendServiceInformation(mockEnv)

      expect(result.name).toBe("video-downloader-front-end")
      expect(typeof result.version).toBe("string")
      expect(result.timestamp).toBeInstanceOf(DateTime)
    })

    test("should treat empty build variables as absent rather than an invalid date", () => {
      const result = frontendServiceInformation({ ...import.meta.env, VITE_BUILD_TIMESTAMP: "", VITE_GIT_BRANCH: "", VITE_GIT_COMMIT: "" })

      expect(result.buildTimestamp.isEmpty()).toBe(true)
      expect(result.gitBranch.isEmpty()).toBe(true)
      expect(result.gitCommit.isEmpty()).toBe(true)
    })

    test("should parse a build timestamp", () => {
      const result = frontendServiceInformation({ ...import.meta.env, VITE_BUILD_TIMESTAMP: "2024-01-15T10:30:00Z" })

      expect(result.buildTimestamp.map((timestamp) => timestamp.toMillis()).toNullable())
        .toBe(DateTime.fromISO("2024-01-15T10:30:00Z").toMillis())
    })
  })
})
