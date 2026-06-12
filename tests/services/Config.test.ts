import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"

describe("Config", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  const stubHost = (host: string) => {
    vi.stubGlobal("window", {
      location: { host },
    })
  }

  describe("getEnvironment", () => {
    test("should return Environment.Production for the production host", async () => {
      stubHost("videos.ruchij.com")

      const { Environment, getEnvironment } = await import("~/services/Config")

      expect(getEnvironment()).toBe(Environment.Production)
    })

    test("should return Environment.Staging for the staging host", async () => {
      stubHost("staging.videos.ruchij.com")

      const { Environment, getEnvironment } = await import("~/services/Config")

      expect(getEnvironment()).toBe(Environment.Staging)
    })

    test("should return Environment.Development for an unknown host", async () => {
      stubHost("unknown-host.example.com")

      const { Environment, getEnvironment } = await import("~/services/Config")

      expect(getEnvironment()).toBe(Environment.Development)
    })

    test("should return Environment.Development for localhost", async () => {
      stubHost("localhost:3000")

      const { Environment, getEnvironment } = await import("~/services/Config")

      expect(getEnvironment()).toBe(Environment.Development)
    })
  })
})
