import { describe, expect, test } from "vitest"
import { HealthStatus, HealthCheck, FileRepositoryHealthStatusDetails } from "~/models/HealthCheck"

describe("HealthCheck", () => {
  describe("HealthStatus enum", () => {
    test("should have correct values", () => {
      expect(HealthStatus.Healthy).toBe("Healthy")
      expect(HealthStatus.Unhealthy).toBe("Unhealthy")
    })
  })

  describe("HealthCheck schema", () => {
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

    test("should parse valid health check data", () => {
      const result = HealthCheck.safeParse(validHealthCheckData)
      expect(result.success).toBe(true)
    })

    test("should transform durationInMs to Duration object", () => {
      const result = HealthCheck.parse(validHealthCheckData)
      expect(result.database.duration.as("milliseconds")).toBe(100)
      expect(result.keyValueStore.duration.as("milliseconds")).toBe(25)
    })

    test("should parse unhealthy status", () => {
      const unhealthyData = {
        ...validHealthCheckData,
        database: { durationInMs: 5000, healthStatus: "Unhealthy" },
      }
      const result = HealthCheck.parse(unhealthyData)
      expect(result.database.healthStatus).toBe(HealthStatus.Unhealthy)
    })

    test("should fail on invalid health status", () => {
      const invalidData = {
        ...validHealthCheckData,
        database: { durationInMs: 100, healthStatus: "Invalid" },
      }
      const result = HealthCheck.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test("should fail on missing required fields", () => {
      const incompleteData = {
        database: { durationInMs: 100, healthStatus: "Healthy" },
      }
      const result = HealthCheck.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })
  })

  describe("FileRepositoryHealthStatusDetails schema", () => {
    test("should parse with otherVideoFolders", () => {
      const data = {
        imageFolder: {
          filePath: "/images",
          healthStatusDetails: { durationInMs: 50, healthStatus: "Healthy" },
        },
        videoFolder: {
          filePath: "/videos",
          healthStatusDetails: { durationInMs: 75, healthStatus: "Healthy" },
        },
        otherVideoFolders: [
          {
            filePath: "/videos2",
            healthStatusDetails: { durationInMs: 80, healthStatus: "Healthy" },
          },
        ],
      }
      const result = FileRepositoryHealthStatusDetails.parse(data)
      expect(result.otherVideoFolders).toHaveLength(1)
    })

    test("should parse with null otherVideoFolders", () => {
      const data = {
        imageFolder: {
          filePath: "/images",
          healthStatusDetails: { durationInMs: 50, healthStatus: "Healthy" },
        },
        videoFolder: {
          filePath: "/videos",
          healthStatusDetails: { durationInMs: 75, healthStatus: "Healthy" },
        },
        otherVideoFolders: null,
      }
      const result = FileRepositoryHealthStatusDetails.parse(data)
      expect(result.otherVideoFolders).toBeNull()
    })

    test("should parse with undefined otherVideoFolders", () => {
      const data = {
        imageFolder: {
          filePath: "/images",
          healthStatusDetails: { durationInMs: 50, healthStatus: "Healthy" },
        },
        videoFolder: {
          filePath: "/videos",
          healthStatusDetails: { durationInMs: 75, healthStatus: "Healthy" },
        },
      }
      const result = FileRepositoryHealthStatusDetails.parse(data)
      expect(result.otherVideoFolders).toBeUndefined()
    })
  })
})
