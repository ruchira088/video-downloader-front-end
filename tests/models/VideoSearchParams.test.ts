import { describe, expect, test } from "vitest"
import { Duration } from "luxon"
import { Some, None } from "~/types/Option"
import { Right, Left } from "~/types/Either"
import { SortBy } from "~/models/SortBy"
import { Ordering } from "~/models/Ordering"
import {
  VideoSearchParamName,
  DurationRangeSearchParam,
  SizeRangeSearchParam,
  SearchTermSearchParam,
  SortBySearchParam,
  VideoSitesSearchParam,
  OrderingSearchParam,
  parseSearchParam,
} from "~/pages/authenticated/videos/components/VideoSearchParams"

describe("VideoSearchParams", () => {
  describe("VideoSearchParamName", () => {
    test("should have correct enum values", () => {
      expect(VideoSearchParamName.DurationRange).toBe("duration-range")
      expect(VideoSearchParamName.SizeRange).toBe("size-range")
      expect(VideoSearchParamName.SearchTerm).toBe("search-term")
      expect(VideoSearchParamName.SortBy).toBe("sort-by")
      expect(VideoSearchParamName.Site).toBe("site")
      expect(VideoSearchParamName.Ordering).toBe("ordering")
    })
  })

  describe("DurationRangeSearchParam", () => {
    test("should have correct name", () => {
      expect(DurationRangeSearchParam.name).toBe(VideoSearchParamName.DurationRange)
    })

    test("should have correct default value", () => {
      expect(DurationRangeSearchParam.default.min.as("minutes")).toBe(0)
      expect(DurationRangeSearchParam.default.max).toBeInstanceOf(None)
    })

    test("should encode duration range to string", () => {
      const range = {
        min: Duration.fromObject({ minutes: 10 }),
        max: Some.of(Duration.fromObject({ minutes: 60 })),
      }
      const encoded = DurationRangeSearchParam.encoder.encode(range)
      expect(encoded).toContain("10")
      expect(encoded).toContain("60")
    })

    test("should decode string to duration range", () => {
      const result = DurationRangeSearchParam.decoder.decode("10,60")
      expect(result).toBeInstanceOf(Right)
    })
  })

  describe("SizeRangeSearchParam", () => {
    test("should have correct name", () => {
      expect(SizeRangeSearchParam.name).toBe(VideoSearchParamName.SizeRange)
    })

    test("should have correct default value", () => {
      expect(SizeRangeSearchParam.default.min).toBe(0)
      expect(SizeRangeSearchParam.default.max).toBeInstanceOf(None)
    })

    test("should encode size range to string", () => {
      const range = {
        min: 1000,
        max: Some.of(5000),
      }
      const encoded = SizeRangeSearchParam.encoder.encode(range)
      expect(encoded).toContain("1000")
      expect(encoded).toContain("5000")
    })

    test("should decode string to size range", () => {
      const result = SizeRangeSearchParam.decoder.decode("1000,5000")
      expect(result).toBeInstanceOf(Right)
    })
  })

  describe("SearchTermSearchParam", () => {
    test("should have correct name", () => {
      expect(SearchTermSearchParam.name).toBe(VideoSearchParamName.SearchTerm)
    })

    test("should have correct default value", () => {
      expect(SearchTermSearchParam.default).toBeInstanceOf(None)
    })

    test("should encode Some search term", () => {
      const encoded = SearchTermSearchParam.encoder.encode(Some.of("test query"))
      expect(encoded).toBe("test query")
    })

    test("should encode None search term as empty string", () => {
      const encoded = SearchTermSearchParam.encoder.encode(None.of())
      expect(encoded).toBe("")
    })

    test("should decode string values", () => {
      const result = SearchTermSearchParam.decoder.decode("search text")
      expect(result).toBeInstanceOf(Right)
    })
  })

  describe("SortBySearchParam", () => {
    test("should have correct name", () => {
      expect(SortBySearchParam.name).toBe(VideoSearchParamName.SortBy)
    })

    test("should have correct default value", () => {
      expect(SortBySearchParam.default).toBe(SortBy.Date)
    })

    test("should encode SortBy to string", () => {
      expect(SortBySearchParam.encoder.encode(SortBy.Date)).toBe("date")
      expect(SortBySearchParam.encoder.encode(SortBy.Size)).toBe("size")
      expect(SortBySearchParam.encoder.encode(SortBy.Duration)).toBe("duration")
      expect(SortBySearchParam.encoder.encode(SortBy.Title)).toBe("title")
    })

    test("should decode valid SortBy string", () => {
      const result = SortBySearchParam.decoder.decode("size")
      expect(result).toBeInstanceOf(Right)
      result.fold(
        () => { throw new Error("Expected Right") },
        (sortBy) => expect(sortBy).toBe(SortBy.Size)
      )
    })

    test("should return error for invalid SortBy string", () => {
      const result = SortBySearchParam.decoder.decode("invalid")
      expect(result).toBeInstanceOf(Left)
    })
  })

  describe("OrderingSearchParam", () => {
    test("should have correct name", () => {
      expect(OrderingSearchParam.name).toBe(VideoSearchParamName.Ordering)
    })

    test("should have correct default value", () => {
      expect(OrderingSearchParam.default).toBe(Ordering.Descending)
    })

    test("should encode Ordering to string", () => {
      expect(OrderingSearchParam.encoder.encode(Ordering.Ascending)).toBe("asc")
      expect(OrderingSearchParam.encoder.encode(Ordering.Descending)).toBe("desc")
    })

    test("should decode valid Ordering string", () => {
      const result = OrderingSearchParam.decoder.decode("asc")
      expect(result).toBeInstanceOf(Right)
      result.fold(
        () => { throw new Error("Expected Right") },
        (ordering) => expect(ordering).toBe(Ordering.Ascending)
      )
    })

    test("should return error for invalid Ordering string", () => {
      const result = OrderingSearchParam.decoder.decode("invalid")
      expect(result).toBeInstanceOf(Left)
    })
  })

  describe("VideoSitesSearchParam", () => {
    test("should have correct name", () => {
      expect(VideoSitesSearchParam.name).toBe(VideoSearchParamName.Site)
    })

    test("should have correct default value", () => {
      expect(VideoSitesSearchParam.default).toEqual([])
    })

    test("should encode array of sites to comma-separated string", () => {
      const sites = ["youtube.com", "vimeo.com", "dailymotion.com"]
      const encoded = VideoSitesSearchParam.encoder.encode(sites)
      expect(encoded).toBe("youtube.com,vimeo.com,dailymotion.com")
    })

    test("should encode empty array to empty string", () => {
      const encoded = VideoSitesSearchParam.encoder.encode([])
      expect(encoded).toBe("")
    })

    test("should decode comma-separated string to array", () => {
      const result = VideoSitesSearchParam.decoder.decode("site1.com,site2.com")
      expect(result).toBeInstanceOf(Right)
      result.fold(
        () => { throw new Error("Expected Right") },
        (sites) => {
          expect(sites).toEqual(["site1.com", "site2.com"])
        }
      )
    })

    test("should filter out empty strings when decoding", () => {
      const result = VideoSitesSearchParam.decoder.decode("site1.com,,site2.com,")
      expect(result).toBeInstanceOf(Right)
      result.fold(
        () => { throw new Error("Expected Right") },
        (sites) => {
          expect(sites).toEqual(["site1.com", "site2.com"])
        }
      )
    })

    test("should decode empty string to empty array", () => {
      const result = VideoSitesSearchParam.decoder.decode("")
      expect(result).toBeInstanceOf(Right)
      result.fold(
        () => { throw new Error("Expected Right") },
        (sites) => {
          expect(sites).toEqual([])
        }
      )
    })
  })

  describe("parseSearchParam", () => {
    test("should parse existing search param", () => {
      const params = new URLSearchParams("sort-by=size")
      const result = parseSearchParam(params, SortBySearchParam)
      expect(result).toBe(SortBy.Size)
    })

    test("should return default when param is missing", () => {
      const params = new URLSearchParams("")
      const result = parseSearchParam(params, SortBySearchParam)
      expect(result).toBe(SortBy.Date) // default
    })

    test("should return default when param is invalid", () => {
      const params = new URLSearchParams("sort-by=invalid")
      const result = parseSearchParam(params, SortBySearchParam)
      expect(result).toBe(SortBy.Date) // default
    })

    test("should parse search term param", () => {
      const params = new URLSearchParams("search-term=hello")
      const result = parseSearchParam(params, SearchTermSearchParam)
      expect(result).toBeInstanceOf(Some)
    })

    test("should parse ordering param", () => {
      const params = new URLSearchParams("ordering=asc")
      const result = parseSearchParam(params, OrderingSearchParam)
      expect(result).toBe(Ordering.Ascending)
    })

    test("should parse video sites param", () => {
      const params = new URLSearchParams("site=youtube.com,vimeo.com")
      const result = parseSearchParam(params, VideoSitesSearchParam)
      expect(result).toEqual(["youtube.com", "vimeo.com"])
    })
  })
})
