import { beforeEach, describe, expect, test, vi } from "vitest"
import { Theme, ApplicationConfiguration } from "~/models/ApplicationConfiguration"
import {
  ConfigurationService,
  localStorageConfigurationService,
  LocalStorageConfigurationService
} from "~/services/config/ConfigurationService"
import { None, Some } from "~/types/Option"

describe("ConfigurationService", () => {
  describe("ConfigurationService abstract class", () => {
    test("getDefaultApplicationConfiguration should return light theme and safeMode false when prefers-color-scheme is not dark", async () => {
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      class TestConfigurationService extends ConfigurationService {
        getApplicationConfiguration = vi.fn()
        setApplicationConfiguration = vi.fn()
      }

      const service = new TestConfigurationService()
      const defaultConfig = await service.getDefaultApplicationConfiguration()

      expect(defaultConfig.theme).toBe(Theme.Light)
      expect(defaultConfig.safeMode).toBe(false)

      window.matchMedia = originalMatchMedia
    })

    test("getDefaultApplicationConfiguration should return dark theme when prefers-color-scheme is dark", async () => {
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      class TestConfigurationService extends ConfigurationService {
        getApplicationConfiguration = vi.fn()
        setApplicationConfiguration = vi.fn()
      }

      const service = new TestConfigurationService()
      const defaultConfig = await service.getDefaultApplicationConfiguration()

      expect(defaultConfig.theme).toBe(Theme.Dark)
      expect(defaultConfig.safeMode).toBe(false)

      window.matchMedia = originalMatchMedia
    })
  })

  describe("LocalStorageConfigurationService", () => {
    const createMockKeyValueStore = () => ({
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })

    test("should get application configuration from key value store", async () => {
      const mockConfig: ApplicationConfiguration = { theme: Theme.Dark, safeMode: true }
      const mockStore = createMockKeyValueStore()
      mockStore.get.mockReturnValue(Some.of(mockConfig))

      const service = new LocalStorageConfigurationService(mockStore as any)
      const result = await service.getApplicationConfiguration()

      expect(result.isEmpty()).toBe(false)
      void result.forEach(config => {
        expect(config.theme).toBe(Theme.Dark)
        expect(config.safeMode).toBe(true)
      })
    })

    test("should return None when no configuration exists", async () => {
      const mockStore = createMockKeyValueStore()
      mockStore.get.mockReturnValue(None.of())

      const service = new LocalStorageConfigurationService(mockStore as any)
      const result = await service.getApplicationConfiguration()

      expect(result.isEmpty()).toBe(true)
    })

    test("should set application configuration in key value store", async () => {
      const mockConfig: ApplicationConfiguration = { theme: Theme.Light, safeMode: false }
      const mockStore = createMockKeyValueStore()

      const service = new LocalStorageConfigurationService(mockStore as any)
      await service.setApplicationConfiguration(mockConfig)

      expect(mockStore.put).toHaveBeenCalledWith("AppConfigKey", mockConfig)
    })

    test("should handle theme change from light to dark", async () => {
      const mockStore = createMockKeyValueStore()

      const service = new LocalStorageConfigurationService(mockStore as any)

      await service.setApplicationConfiguration({ theme: Theme.Dark, safeMode: false })
      expect(mockStore.put).toHaveBeenCalledWith("AppConfigKey", { theme: Theme.Dark, safeMode: false })
    })

    test("should handle safe mode change", async () => {
      const mockStore = createMockKeyValueStore()

      const service = new LocalStorageConfigurationService(mockStore as any)

      await service.setApplicationConfiguration({ theme: Theme.Light, safeMode: true })
      expect(mockStore.put).toHaveBeenCalledWith("AppConfigKey", { theme: Theme.Light, safeMode: true })

      await service.setApplicationConfiguration({ theme: Theme.Light, safeMode: false })
      expect(mockStore.put).toHaveBeenCalledWith("AppConfigKey", { theme: Theme.Light, safeMode: false })
    })

    test("should call get with correct key", async () => {
      const mockStore = createMockKeyValueStore()
      mockStore.get.mockReturnValue(None.of())

      const service = new LocalStorageConfigurationService(mockStore as any)
      await service.getApplicationConfiguration()

      expect(mockStore.get).toHaveBeenCalledWith("AppConfigKey")
    })
  })
  // The exported singleton is what the app actually uses, and it is the only thing that
  // exercises the KeySpace codec that encodes/decodes the configuration for localStorage.
  describe("localStorageConfigurationService", () => {
    // Mirrors `${keySpace.name}-${keyEncoder.encode(key)}` in LocalKeyValueStore.
    const storageKey = "application-configuration-AppConfigKey"

    beforeEach(() => {
      localStorage.clear()
    })

    test("should round-trip a configuration through localStorage", async () => {
      const configuration: ApplicationConfiguration = { theme: Theme.Dark, safeMode: true }

      await localStorageConfigurationService.setApplicationConfiguration(configuration)
      const result = await localStorageConfigurationService.getApplicationConfiguration()

      expect(result.toNullable()).toEqual(configuration)
    })

    test("should persist the configuration as JSON under the namespaced key", async () => {
      await localStorageConfigurationService.setApplicationConfiguration({ theme: Theme.Light, safeMode: false })

      expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({ theme: "light", safeMode: false })
    })

    test("should return None when nothing has been stored", async () => {
      const result = await localStorageConfigurationService.getApplicationConfiguration()

      expect(result.isEmpty()).toBe(true)
    })

    test("should discard a stored value that is not valid JSON", async () => {
      localStorage.setItem(storageKey, "}{ not json")

      const result = await localStorageConfigurationService.getApplicationConfiguration()

      expect(result.isEmpty()).toBe(true)
      // A value that cannot be decoded is cleared so the app falls back to defaults
      // instead of failing on every subsequent read.
      expect(localStorage.getItem(storageKey)).toBeNull()
    })

    test("should discard a stored value that no longer matches the schema", async () => {
      localStorage.setItem(storageKey, JSON.stringify({ theme: "solarized", safeMode: true }))

      const result = await localStorageConfigurationService.getApplicationConfiguration()

      expect(result.isEmpty()).toBe(true)
      expect(localStorage.getItem(storageKey)).toBeNull()
    })

    test("should apply the schema default for a missing safeMode", async () => {
      localStorage.setItem(storageKey, JSON.stringify({ theme: "dark" }))

      const result = await localStorageConfigurationService.getApplicationConfiguration()

      expect(result.toNullable()).toEqual({ theme: Theme.Dark, safeMode: false })
    })

    test("should overwrite a previously stored configuration", async () => {
      await localStorageConfigurationService.setApplicationConfiguration({ theme: Theme.Light, safeMode: false })
      await localStorageConfigurationService.setApplicationConfiguration({ theme: Theme.Dark, safeMode: true })

      const result = await localStorageConfigurationService.getApplicationConfiguration()

      expect(result.toNullable()).toEqual({ theme: Theme.Dark, safeMode: true })
    })
  })
})
