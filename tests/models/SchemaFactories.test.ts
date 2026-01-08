import { describe, expect, test } from "vitest"
import { z } from "zod/v4"
import { Some, None } from "~/types/Option"
import { ListResponse } from "~/models/ListResponse"
import { SearchResult } from "~/models/SearchResult"

describe("Schema Factories", () => {
  describe("ListResponse", () => {
    test("should create schema for string array", () => {
      const StringListResponse = ListResponse(z.string())
      const data = { results: ["a", "b", "c"] }
      const result = StringListResponse.parse(data)
      expect(result.results).toEqual(["a", "b", "c"])
    })

    test("should create schema for number array", () => {
      const NumberListResponse = ListResponse(z.number())
      const data = { results: [1, 2, 3] }
      const result = NumberListResponse.parse(data)
      expect(result.results).toEqual([1, 2, 3])
    })

    test("should create schema for object array", () => {
      const ItemSchema = z.object({ id: z.string(), name: z.string() })
      const ItemListResponse = ListResponse(ItemSchema)
      const data = {
        results: [
          { id: "1", name: "Item 1" },
          { id: "2", name: "Item 2" },
        ],
      }
      const result = ItemListResponse.parse(data)
      expect(result.results).toHaveLength(2)
      expect(result.results[0].name).toBe("Item 1")
    })

    test("should parse empty results array", () => {
      const StringListResponse = ListResponse(z.string())
      const data = { results: [] }
      const result = StringListResponse.parse(data)
      expect(result.results).toEqual([])
    })

    test("should fail on invalid item type", () => {
      const NumberListResponse = ListResponse(z.number())
      const data = { results: ["not", "numbers"] }
      const result = NumberListResponse.safeParse(data)
      expect(result.success).toBe(false)
    })

    test("should fail on missing results field", () => {
      const StringListResponse = ListResponse(z.string())
      const data = {}
      const result = StringListResponse.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe("SearchResult", () => {
    test("should create schema with pagination info", () => {
      const StringSearchResult = SearchResult(z.string())
      const data = {
        results: ["a", "b"],
        pageNumber: 1,
        pageSize: 10,
        searchTerm: "test",
      }
      const result = StringSearchResult.parse(data)
      expect(result.results).toEqual(["a", "b"])
      expect(result.pageNumber).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.searchTerm).toBeInstanceOf(Some)
    })

    test("should handle null searchTerm", () => {
      const StringSearchResult = SearchResult(z.string())
      const data = {
        results: ["a"],
        pageNumber: 0,
        pageSize: 20,
        searchTerm: null,
      }
      const result = StringSearchResult.parse(data)
      expect(result.searchTerm).toBeInstanceOf(None)
    })

    test("should handle missing searchTerm", () => {
      const StringSearchResult = SearchResult(z.string())
      const data = {
        results: ["a"],
        pageNumber: 0,
        pageSize: 20,
      }
      const result = StringSearchResult.parse(data)
      expect(result.searchTerm).toBeInstanceOf(None)
    })

    test("should create schema for complex objects", () => {
      const VideoSchema = z.object({
        id: z.string(),
        title: z.string(),
        duration: z.number(),
      })
      const VideoSearchResult = SearchResult(VideoSchema)
      const data = {
        results: [
          { id: "v1", title: "Video 1", duration: 120 },
          { id: "v2", title: "Video 2", duration: 300 },
        ],
        pageNumber: 2,
        pageSize: 50,
        searchTerm: "tutorial",
      }
      const result = VideoSearchResult.parse(data)
      expect(result.results).toHaveLength(2)
      expect(result.results[0].title).toBe("Video 1")
      expect(result.searchTerm.getOrElse(() => "")).toBe("tutorial")
    })

    test("should fail on invalid pageNumber", () => {
      const StringSearchResult = SearchResult(z.string())
      const data = {
        results: [],
        pageNumber: "not a number",
        pageSize: 10,
      }
      const result = StringSearchResult.safeParse(data)
      expect(result.success).toBe(false)
    })

    test("should fail on invalid pageSize", () => {
      const StringSearchResult = SearchResult(z.string())
      const data = {
        results: [],
        pageNumber: 0,
        pageSize: "invalid",
      }
      const result = StringSearchResult.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
