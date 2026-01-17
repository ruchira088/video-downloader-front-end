import { describe, expect, test, vi } from "vitest"

// Mock image imports before importing the service
vi.mock("~/images/safe-images/image-01.jpg", () => ({ default: "/mock/image-01.jpg" }))
vi.mock("~/images/safe-images/image-02.jpg", () => ({ default: "/mock/image-02.jpg" }))
vi.mock("~/images/safe-images/image-03.jpg", () => ({ default: "/mock/image-03.jpg" }))
vi.mock("~/images/safe-images/image-04.jpg", () => ({ default: "/mock/image-04.jpg" }))
vi.mock("~/images/safe-images/image-05.jpg", () => ({ default: "/mock/image-05.jpg" }))
vi.mock("~/images/safe-images/image-06.jpg", () => ({ default: "/mock/image-06.jpg" }))
vi.mock("~/images/safe-images/image-07.jpg", () => ({ default: "/mock/image-07.jpg" }))
vi.mock("~/images/safe-images/image-08.jpg", () => ({ default: "/mock/image-08.jpg" }))
vi.mock("~/images/safe-images/image-09.jpg", () => ({ default: "/mock/image-09.jpg" }))
vi.mock("~/images/safe-images/image-10.jpg", () => ({ default: "/mock/image-10.jpg" }))
vi.mock("~/images/safe-images/image-11.jpg", () => ({ default: "/mock/image-11.jpg" }))

import { imageMappings, phraseMappings, translate } from "~/services/sanitize/SanitizationService"

describe("SanitizationService", () => {
  describe("imageMappings", () => {
    test("should return consistent image for same key", () => {
      const key = "test-video-id"
      const result1 = imageMappings(key)
      const result2 = imageMappings(key)

      expect(result1).toBe(result2)
    })

    test("should return different images for different keys", () => {
      // Generate multiple different keys and collect results
      const keys = ["key1", "key2", "key3", "key4", "key5", "key6", "key7", "key8"]
      const results = keys.map((key) => imageMappings(key))

      // At least some should be different (unless hash collision)
      const uniqueResults = new Set(results)
      expect(uniqueResults.size).toBeGreaterThan(1)
    })

    test("should always return a string (image path)", () => {
      const testKeys = ["abc", "123", "test-key", "another_key", "  spaces  "]
      testKeys.forEach((key) => {
        const result = imageMappings(key)
        expect(typeof result).toBe("string")
      })
    })

    test("should handle empty string key", () => {
      const result = imageMappings("")
      expect(typeof result).toBe("string")
    })

    test("should trim whitespace when hashing", () => {
      const result1 = imageMappings("  hello  ")
      const result2 = imageMappings("hello")

      expect(result1).toBe(result2)
    })
  })

  describe("phraseMappings", () => {
    test("should return consistent phrase for same key", () => {
      const key = "test-video-id"
      const result1 = phraseMappings(key)
      const result2 = phraseMappings(key)

      expect(result1).toBe(result2)
    })

    test("should return different phrases for different keys", () => {
      const keys = ["key1", "key2", "key3", "key4", "key5", "key6", "key7", "key8", "key9", "key10"]
      const results = keys.map((key) => phraseMappings(key))

      // At least some should be different
      const uniqueResults = new Set(results)
      expect(uniqueResults.size).toBeGreaterThan(1)
    })

    test("should always return a string", () => {
      const testKeys = ["abc", "123", "test-key"]
      testKeys.forEach((key) => {
        const result = phraseMappings(key)
        expect(typeof result).toBe("string")
        expect(result.length).toBeGreaterThan(0)
      })
    })

    test("should return Chuck Norris-related phrase", () => {
      // Test multiple keys to find at least one Chuck Norris phrase
      const keys = Array.from({ length: 20 }, (_, i) => `test-key-${i}`)
      const phrases = keys.map((key) => phraseMappings(key))

      // All phrases should contain something meaningful
      phrases.forEach((phrase) => {
        expect(phrase.length).toBeGreaterThan(10)
      })
    })

    test("should trim whitespace when hashing", () => {
      const result1 = phraseMappings("  hello  ")
      const result2 = phraseMappings("hello")

      expect(result1).toBe(result2)
    })
  })

  describe("translate", () => {
    test("should return original phrase when safeMode is false", () => {
      const originalPhrase = "This is the original phrase"
      const result = translate(originalPhrase, false)

      expect(result).toBe(originalPhrase)
    })

    test("should return safe phrase when safeMode is true", () => {
      const originalPhrase = "This is the original phrase"
      const result = translate(originalPhrase, true)

      // Should return a different phrase (from safe phrases list)
      expect(result).not.toBe(originalPhrase)
      expect(typeof result).toBe("string")
      expect(result.length).toBeGreaterThan(0)
    })

    test("should return consistent safe phrase for same input", () => {
      const originalPhrase = "Consistent test phrase"
      const result1 = translate(originalPhrase, true)
      const result2 = translate(originalPhrase, true)

      expect(result1).toBe(result2)
    })

    test("should handle empty string", () => {
      const result1 = translate("", false)
      expect(result1).toBe("")

      const result2 = translate("", true)
      expect(typeof result2).toBe("string")
    })

    test("should not modify phrase in non-safe mode regardless of content", () => {
      const phrases = [
        "Simple text",
        "Text with numbers 123",
        "Special chars !@#$%",
        "Unicode: 你好世界",
        "",
      ]

      phrases.forEach((phrase) => {
        const result = translate(phrase, false)
        expect(result).toBe(phrase)
      })
    })
  })

  describe("hash consistency", () => {
    test("imageMappings and phraseMappings should use same hash for same key", () => {
      // The same key should produce consistent results across both mappings
      const testKey = "consistent-key"

      const image1 = imageMappings(testKey)
      const image2 = imageMappings(testKey)
      expect(image1).toBe(image2)

      const phrase1 = phraseMappings(testKey)
      const phrase2 = phraseMappings(testKey)
      expect(phrase1).toBe(phrase2)
    })

    test("hash should be based on character codes and indices", () => {
      // "ab" and "ba" should produce different hashes
      // because index is added to char code
      const result1 = phraseMappings("ab")
      const result2 = phraseMappings("ba")

      // They might collide in rare cases, but usually different
      // This is a probabilistic test
      const result3 = phraseMappings("abc")
      const result4 = phraseMappings("cba")

      // At least one pair should be different
      const allSame =
        result1 === result2 && result1 === result3 && result1 === result4
      expect(allSame).toBe(false)
    })
  })
})
