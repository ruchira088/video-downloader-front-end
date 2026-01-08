import { describe, expect, test } from "vitest"
import { Duration } from "luxon"
import { Right } from "~/types/Either"
import {
  durationRangeNumberEncoder,
  durationRangeNumberDecoder,
  durationRangeStringEncoder,
  durationRangeDecoder,
} from "~/models/DurationRange"

describe("DurationRange", () => {
  describe("durationRangeNumberEncoder", () => {
    test("should encode duration to minutes", () => {
      const duration = Duration.fromObject({ minutes: 30 })
      expect(durationRangeNumberEncoder.encode(duration)).toBe(30)
    })

    test("should encode hours to minutes", () => {
      const duration = Duration.fromObject({ hours: 2 })
      expect(durationRangeNumberEncoder.encode(duration)).toBe(120)
    })

    test("should encode hours and minutes combination", () => {
      const duration = Duration.fromObject({ hours: 1, minutes: 30 })
      expect(durationRangeNumberEncoder.encode(duration)).toBe(90)
    })

    test("should encode zero duration", () => {
      const duration = Duration.fromObject({ minutes: 0 })
      expect(durationRangeNumberEncoder.encode(duration)).toBe(0)
    })

    test("should handle fractional minutes", () => {
      const duration = Duration.fromObject({ seconds: 90 })
      expect(durationRangeNumberEncoder.encode(duration)).toBe(1.5)
    })
  })

  describe("durationRangeNumberDecoder", () => {
    test("should decode number to Duration", () => {
      const result = durationRangeNumberDecoder.decode(30)
      expect(result).toBeInstanceOf(Right)
      result.fold(
        () => { throw new Error("Expected Right") },
        (duration) => {
          expect(duration.as("minutes")).toBe(30)
        }
      )
    })

    test("should decode zero to zero Duration", () => {
      const result = durationRangeNumberDecoder.decode(0)
      expect(result).toBeInstanceOf(Right)
      result.fold(
        () => { throw new Error("Expected Right") },
        (duration) => {
          expect(duration.as("minutes")).toBe(0)
        }
      )
    })

    test("should decode large numbers", () => {
      const result = durationRangeNumberDecoder.decode(1440) // 24 hours
      expect(result).toBeInstanceOf(Right)
      result.fold(
        () => { throw new Error("Expected Right") },
        (duration) => {
          expect(duration.as("hours")).toBe(24)
        }
      )
    })
  })

  describe("durationRangeStringEncoder", () => {
    test("should encode duration to string", () => {
      const duration = Duration.fromObject({ minutes: 45 })
      expect(durationRangeStringEncoder.encode(duration)).toBe("45")
    })

    test("should encode zero duration to string", () => {
      const duration = Duration.fromObject({ minutes: 0 })
      expect(durationRangeStringEncoder.encode(duration)).toBe("0")
    })

    test("should encode large duration to string", () => {
      const duration = Duration.fromObject({ hours: 10 })
      expect(durationRangeStringEncoder.encode(duration)).toBe("600")
    })
  })

  describe("durationRangeDecoder", () => {
    test("should decode string to Duration", () => {
      const result = durationRangeDecoder.decode("60")
      expect(result).toBeInstanceOf(Right)
      result.fold(
        () => { throw new Error("Expected Right") },
        (duration) => {
          expect(duration.as("minutes")).toBe(60)
        }
      )
    })

    test("should decode zero string to Duration", () => {
      const result = durationRangeDecoder.decode("0")
      expect(result).toBeInstanceOf(Right)
      result.fold(
        () => { throw new Error("Expected Right") },
        (duration) => {
          expect(duration.as("minutes")).toBe(0)
        }
      )
    })
  })

  describe("Encoder/Decoder roundtrip", () => {
    test("should roundtrip number encoding", () => {
      const original = Duration.fromObject({ minutes: 75 })
      const encoded = durationRangeNumberEncoder.encode(original)
      const decoded = durationRangeNumberDecoder.decode(encoded)

      decoded.fold(
        () => { throw new Error("Expected Right") },
        (duration) => {
          expect(duration.as("minutes")).toBe(original.as("minutes"))
        }
      )
    })

    test("should roundtrip string encoding", () => {
      const original = Duration.fromObject({ hours: 2, minutes: 15 })
      const encoded = durationRangeStringEncoder.encode(original)
      const decoded = durationRangeDecoder.decode(encoded)

      decoded.fold(
        () => { throw new Error("Expected Right") },
        (duration) => {
          expect(duration.as("minutes")).toBe(original.as("minutes"))
        }
      )
    })
  })
})
