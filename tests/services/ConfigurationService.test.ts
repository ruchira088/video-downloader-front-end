import { describe, expect, test, vi } from "vitest"
import { Theme } from "~/models/ApplicationConfiguration"
import { ConfigurationService } from "~/services/config/ConfigurationService"

describe("ConfigurationService", () => {
  describe("ConfigurationService abstract class", () => {
    test("getDefaultApplicationConfiguration should return light theme and safeMode false", async () => {
      // Create a minimal implementation of the abstract class
      class TestConfigurationService extends ConfigurationService {
        getApplicationConfiguration = vi.fn()
        setApplicationConfiguration = vi.fn()
      }

      const service = new TestConfigurationService()
      const defaultConfig = await service.getDefaultApplicationConfiguration()

      expect(defaultConfig.theme).toBe(Theme.Light)
      expect(defaultConfig.safeMode).toBe(false)
    })
  })

  // LocalStorageConfigurationService is tested via integration with the real KeyValueStore
  // Testing the abstract class's default configuration is sufficient for unit tests
})
