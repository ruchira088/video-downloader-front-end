import { afterEach, describe, expect, test, vi } from "vitest"

import { Environment, getEnvironment } from "~/services/Config"

const stubHost = (host: string): void => {
  vi.stubGlobal("window", { location: { host } })
}

describe("Config", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("getEnvironment", () => {
    test("returns Development when there is no window (server-side)", () => {
      vi.stubGlobal("window", undefined)

      expect(getEnvironment()).toBe(Environment.Development)
    })

    test("returns Staging for the staging host", () => {
      stubHost("staging.videos.ruchij.com")

      expect(getEnvironment()).toBe(Environment.Staging)
    })

    test("returns Production for the production host", () => {
      stubHost("videos.ruchij.com")

      expect(getEnvironment()).toBe(Environment.Production)
    })

    test("returns Branch for a branch sub-domain of videos.ruchij.com", () => {
      stubHost("my-feature.videos.ruchij.com")

      expect(getEnvironment()).toBe(Environment.Branch)
    })

    test("returns Branch for a deeper sub-domain of videos.ruchij.com", () => {
      stubHost("my-feature.preview.videos.ruchij.com")

      expect(getEnvironment()).toBe(Environment.Branch)
    })

    test("returns Development for localhost", () => {
      stubHost("localhost:3000")

      expect(getEnvironment()).toBe(Environment.Development)
    })

    test("returns Development for an unrelated host", () => {
      stubHost("example.com")

      expect(getEnvironment()).toBe(Environment.Development)
    })
  })
})
