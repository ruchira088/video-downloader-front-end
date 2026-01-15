import { describe, expect, test } from "vitest"
import { z } from "zod/v4"
import {
  Range,
  toNumberArray,
  fromNumberArray,
  rangeEncoder,
  rangeDecoder,
} from "~/models/Range"
import { simpleStringEncoder, stringToNumberDecoder } from "~/models/Codec"
import { type Option, Some, None } from "~/types/Option"
import { Right, Left } from "~/types/Either"

type RangeResult = { min: number; max: Option<number> }

describe("Range schema", () => {
  const NumberRange = Range(z.number())

  test("should parse range with min and max", () => {
    const result = NumberRange.parse({ min: 10, max: 100 })

    expect(result.min).toBe(10)
    expect(result.max).toBeInstanceOf(Some)
    expect((result.max as Some<number>).value).toBe(100)
  })

  test("should parse range with only min (max as null)", () => {
    const result = NumberRange.parse({ min: 10, max: null })

    expect(result.min).toBe(10)
    expect(result.max).toBeInstanceOf(None)
  })

  test("should parse range with only min (max as undefined)", () => {
    const result = NumberRange.parse({ min: 10, max: undefined })

    expect(result.min).toBe(10)
    expect(result.max).toBeInstanceOf(None)
  })

  test("should reject missing min", () => {
    expect(() => NumberRange.parse({ max: 100 })).toThrow()
  })

  test("should work with string type", () => {
    const StringRange = Range(z.string())
    const result = StringRange.parse({ min: "a", max: "z" })

    expect(result.min).toBe("a")
    expect((result.max as Some<string>).value).toBe("z")
  })
})

describe("toNumberArray", () => {
  const numberEncoder = { encode: (n: number) => n }

  test("should convert range with max to number array", () => {
    const range = { min: 10, max: Some.of(100) }
    const result = toNumberArray(range, 1000, numberEncoder)

    expect(result).toStrictEqual([10, 100])
  })

  test("should use maximum when max is None", () => {
    const range = { min: 10, max: None.of<number>() }
    const result = toNumberArray(range, 1000, numberEncoder)

    expect(result).toStrictEqual([10, 1000])
  })

  test("should work with custom encoder", () => {
    const durationEncoder = { encode: (seconds: number) => seconds * 1000 }
    const range = { min: 60, max: Some.of(3600) }
    const result = toNumberArray(range, 7200, durationEncoder)

    expect(result).toStrictEqual([60000, 3600000])
  })
})

describe("fromNumberArray", () => {
  const numberDecoder = {
    decode: (n: number) => Right.of<Error, number>(n),
  }

  test("should convert number array to range with max", () => {
    const result = fromNumberArray([10, 100], numberDecoder, (n) => n >= 1000)

    expect(result).toBeInstanceOf(Right)
    const range = (result as Right<Error, RangeResult>).value
    expect(range.min).toBe(10)
    expect(range.max).toBeInstanceOf(Some)
    expect(range.max.fold(() => -1, v => v)).toBe(100)
  })

  test("should convert number array to range with None max when isMax returns true", () => {
    const result = fromNumberArray([10, 1000], numberDecoder, (n) => n >= 1000)

    expect(result).toBeInstanceOf(Right)
    const range = (result as Right<Error, RangeResult>).value
    expect(range.min).toBe(10)
    expect(range.max).toBeInstanceOf(None)
  })

  test("should return Left when decoder fails for min", () => {
    const failingDecoder = {
      decode: (n: number) =>
        n < 0 ? Left.of<Error, number>(new Error("Negative")) : Right.of<Error, number>(n),
    }

    const result = fromNumberArray([-10, 100], failingDecoder, () => false)
    expect(result).toBeInstanceOf(Left)
  })

  test("should return Left when decoder fails for max", () => {
    const failingDecoder = {
      decode: (n: number) =>
        n > 500 ? Left.of<Error, number>(new Error("Too large")) : Right.of<Error, number>(n),
    }

    const result = fromNumberArray([10, 1000], failingDecoder, () => false)
    expect(result).toBeInstanceOf(Left)
  })
})

describe("rangeEncoder", () => {
  const stringEncoder = simpleStringEncoder<number>()
  const encoder = rangeEncoder(stringEncoder)

  test("should encode range with max", () => {
    const range = { min: 10, max: Some.of(100) }
    const result = encoder.encode(range)

    expect(result).toBe("10-100")
  })

  test("should encode range without max", () => {
    const range = { min: 10, max: None.of<number>() }
    const result = encoder.encode(range)

    expect(result).toBe("10-")
  })

  test("should handle zero values", () => {
    const range = { min: 0, max: Some.of(0) }
    const result = encoder.encode(range)

    expect(result).toBe("0-0")
  })

  test("should work with custom encoder", () => {
    const prefixEncoder = { encode: (n: number) => `val_${n}` }
    const customEncoder = rangeEncoder(prefixEncoder)

    const range = { min: 5, max: Some.of(10) }
    const result = customEncoder.encode(range)

    expect(result).toBe("val_5-val_10")
  })
})

describe("rangeDecoder", () => {
  const decoder = rangeDecoder(stringToNumberDecoder)

  test("should decode range string with max", () => {
    const result = decoder.decode("10-100")

    expect(result).toBeInstanceOf(Right)
    const range = (result as Right<Error, RangeResult>).value
    expect(range.min).toBe(10)
    expect(range.max).toBeInstanceOf(Some)
    expect(range.max.fold(() => -1, v => v)).toBe(100)
  })

  test("should decode range string without max", () => {
    const result = decoder.decode("10-")

    expect(result).toBeInstanceOf(Right)
    const range = (result as Right<Error, RangeResult>).value
    expect(range.min).toBe(10)
    expect(range.max).toBeInstanceOf(None)
  })

  test("should decode range string with whitespace in max", () => {
    const result = decoder.decode("10-   ")

    expect(result).toBeInstanceOf(Right)
    const range = (result as Right<Error, RangeResult>).value
    expect(range.max).toBeInstanceOf(None)
  })

  test("should handle zero values", () => {
    const result = decoder.decode("0-0")

    expect(result).toBeInstanceOf(Right)
    const range = (result as Right<Error, RangeResult>).value
    expect(range.min).toBe(0)
    expect(range.max.fold(() => -1, v => v)).toBe(0)
  })
})

describe("Range encoder-decoder round trip", () => {
  const stringEncoder = simpleStringEncoder<number>()
  const encoder = rangeEncoder(stringEncoder)
  const decoder = rangeDecoder(stringToNumberDecoder)

  test("should round trip range with max", () => {
    const original = { min: 42, max: Some.of(999) }
    const encoded = encoder.encode(original)
    const decoded = decoder.decode(encoded)

    expect(decoded).toBeInstanceOf(Right)
    const result = (decoded as Right<Error, RangeResult>).value
    expect(result.min).toBe(original.min)
    expect(result.max.fold(() => -1, v => v)).toBe(original.max.value)
  })

  test("should round trip range without max", () => {
    const original = { min: 42, max: None.of<number>() }
    const encoded = encoder.encode(original)
    const decoded = decoder.decode(encoded)

    expect(decoded).toBeInstanceOf(Right)
    const result = (decoded as Right<Error, RangeResult>).value
    expect(result.min).toBe(original.min)
    expect(result.max).toBeInstanceOf(None)
  })
})
