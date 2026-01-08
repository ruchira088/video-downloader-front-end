import { describe, expect, test } from "vitest"
import {
  codec,
  identityCodec,
  encodeMap,
  decodeMap,
  simpleStringEncoder,
  stringToNumberDecoder,
  type Encoder,
  type Decoder,
} from "~/models/Codec"
import { Right, Left } from "~/types/Either"

describe("codec", () => {
  test("should create a codec from encoder and decoder", () => {
    const numberToStringEncoder: Encoder<number, string> = {
      encode: (n) => n.toString(),
    }

    const stringToNumberDecoderLocal: Decoder<string, number> = {
      decode: (s) => {
        const n = parseInt(s, 10)
        return isNaN(n) ? Left.of(new Error("Invalid number")) : Right.of(n)
      },
    }

    const numberCodec = codec(numberToStringEncoder, stringToNumberDecoderLocal)

    // Test encode
    expect(numberCodec.encode(42)).toBe("42")
    expect(numberCodec.encode(0)).toBe("0")
    expect(numberCodec.encode(-10)).toBe("-10")

    // Test decode
    const decoded = numberCodec.decode("42")
    expect(decoded).toBeInstanceOf(Right)
    expect((decoded as Right<Error, number>).value).toBe(42)

    const invalidDecoded = numberCodec.decode("not a number")
    expect(invalidDecoded).toBeInstanceOf(Left)
  })
})

describe("identityCodec", () => {
  test("should encode value as itself", () => {
    const stringCodec = identityCodec<string>()
    expect(stringCodec.encode("hello")).toBe("hello")

    const numberCodec = identityCodec<number>()
    expect(numberCodec.encode(42)).toBe(42)

    const objectCodec = identityCodec<{ a: number }>()
    const obj = { a: 1 }
    expect(objectCodec.encode(obj)).toBe(obj)
  })

  test("should decode value as Right of itself", () => {
    const stringCodec = identityCodec<string>()
    const decoded = stringCodec.decode("hello")
    expect(decoded).toBeInstanceOf(Right)
    expect((decoded as Right<Error, string>).value).toBe("hello")
  })

  test("should work with complex types", () => {
    type Person = { name: string; age: number }
    const personCodec = identityCodec<Person>()

    const person: Person = { name: "John", age: 30 }
    expect(personCodec.encode(person)).toBe(person)

    const decoded = personCodec.decode(person)
    expect(decoded).toBeInstanceOf(Right)
    expect((decoded as Right<Error, Person>).value).toBe(person)
  })
})

describe("simpleStringEncoder", () => {
  test("should encode numbers to strings", () => {
    const encoder = simpleStringEncoder<number>()
    expect(encoder.encode(42)).toBe("42")
    expect(encoder.encode(0)).toBe("0")
    expect(encoder.encode(-10)).toBe("-10")
    expect(encoder.encode(3.14)).toBe("3.14")
  })

  test("should encode booleans to strings", () => {
    const encoder = simpleStringEncoder<boolean>()
    expect(encoder.encode(true)).toBe("true")
    expect(encoder.encode(false)).toBe("false")
  })

  test("should encode strings to strings", () => {
    const encoder = simpleStringEncoder<string>()
    expect(encoder.encode("hello")).toBe("hello")
    expect(encoder.encode("")).toBe("")
  })

  test("should encode objects using toString", () => {
    const encoder = simpleStringEncoder<object>()
    expect(encoder.encode({})).toBe("[object Object]")
  })

  test("should encode null and undefined", () => {
    const encoder = simpleStringEncoder<null>()
    expect(encoder.encode(null)).toBe("null")

    const undefinedEncoder = simpleStringEncoder<undefined>()
    expect(undefinedEncoder.encode(undefined)).toBe("undefined")
  })
})

describe("stringToNumberDecoder", () => {
  test("should decode valid number strings", () => {
    const result = stringToNumberDecoder.decode("42")
    expect(result).toBeInstanceOf(Right)
    expect((result as Right<Error, number>).value).toBe(42)
  })

  test("should decode negative numbers", () => {
    const result = stringToNumberDecoder.decode("-10")
    expect(result).toBeInstanceOf(Right)
    expect((result as Right<Error, number>).value).toBe(-10)
  })

  test("should decode zero", () => {
    const result = stringToNumberDecoder.decode("0")
    expect(result).toBeInstanceOf(Right)
    expect((result as Right<Error, number>).value).toBe(0)
  })

  test("should handle strings with leading zeros", () => {
    const result = stringToNumberDecoder.decode("007")
    expect(result).toBeInstanceOf(Right)
    expect((result as Right<Error, number>).value).toBe(7)
  })

  test("should parse integer part of decimal strings", () => {
    const result = stringToNumberDecoder.decode("3.14")
    expect(result).toBeInstanceOf(Right)
    expect((result as Right<Error, number>).value).toBe(3)
  })
})

describe("encodeMap", () => {
  test("should transform encoder output", () => {
    const numberEncoder: Encoder<number, number> = {
      encode: (n) => n * 2,
    }

    const mappedEncoder = encodeMap(numberEncoder, (n) => n.toString())
    expect(mappedEncoder.encode(5)).toBe("10")
    expect(mappedEncoder.encode(0)).toBe("0")
  })

  test("should chain multiple transformations", () => {
    const baseEncoder: Encoder<string, string> = {
      encode: (s) => s.toLowerCase(),
    }

    const step1 = encodeMap(baseEncoder, (s) => s.trim())
    const step2 = encodeMap(step1, (s) => `[${s}]`)

    expect(step2.encode("  HELLO  ")).toBe("[hello]")
  })

  test("should work with type transformations", () => {
    const lengthEncoder: Encoder<string, number> = {
      encode: (s) => s.length,
    }

    const mappedEncoder = encodeMap(lengthEncoder, (n) => n > 5)
    expect(mappedEncoder.encode("hello")).toBe(false)
    expect(mappedEncoder.encode("hello world")).toBe(true)
  })
})

describe("decodeMap", () => {
  test("should transform decoder output on success", () => {
    const mappedDecoder = decodeMap(stringToNumberDecoder, (n) => n * 2)

    const result = mappedDecoder.decode("21")
    expect(result).toBeInstanceOf(Right)
    expect((result as Right<Error, number>).value).toBe(42)
  })

  test("should preserve Left on decode failure", () => {
    const failingDecoder: Decoder<string, number> = {
      decode: () => Left.of(new Error("always fails")),
    }

    const mappedDecoder = decodeMap(failingDecoder, (n) => n * 2)
    const result = mappedDecoder.decode("anything")

    expect(result).toBeInstanceOf(Left)
    expect((result as Left<Error, number>).value.message).toBe("always fails")
  })

  test("should chain multiple transformations", () => {
    const step1 = decodeMap(stringToNumberDecoder, (n) => n * 2)
    const step2 = decodeMap(step1, (n) => n.toString())
    const step3 = decodeMap(step2, (s) => `Result: ${s}`)

    const result = step3.decode("21")
    expect(result).toBeInstanceOf(Right)
    expect((result as Right<Error, string>).value).toBe("Result: 42")
  })

  test("should work with complex type transformations", () => {
    type Person = { name: string; age: number }

    const mappedDecoder = decodeMap(stringToNumberDecoder, (age): Person => ({
      name: "Unknown",
      age,
    }))

    const result = mappedDecoder.decode("25")
    expect(result).toBeInstanceOf(Right)
    expect((result as Right<Error, Person>).value).toStrictEqual({
      name: "Unknown",
      age: 25,
    })
  })
})

describe("Encoder and Decoder integration", () => {
  test("should support round-trip encoding and decoding", () => {
    const numberToString: Encoder<number, string> = {
      encode: (n) => n.toString(),
    }

    // Encode a number
    const encoded = numberToString.encode(42)
    expect(encoded).toBe("42")

    // Decode it back
    const decoded = stringToNumberDecoder.decode(encoded)
    expect(decoded).toBeInstanceOf(Right)
    expect((decoded as Right<Error, number>).value).toBe(42)
  })

  test("should handle complex encode-decode workflows", () => {
    type Config = { port: number; host: string }

    const configEncoder: Encoder<Config, string> = {
      encode: (config) => JSON.stringify(config),
    }

    const configDecoder: Decoder<string, Config> = {
      decode: (s) => {
        try {
          const parsed = JSON.parse(s)
          if (typeof parsed.port !== "number" || typeof parsed.host !== "string") {
            return Left.of(new Error("Invalid config format"))
          }
          return Right.of(parsed as Config)
        } catch (e) {
          return Left.of(e as Error)
        }
      },
    }

    const config: Config = { port: 3000, host: "localhost" }
    const encoded = configEncoder.encode(config)
    const decoded = configDecoder.decode(encoded)

    expect(decoded).toBeInstanceOf(Right)
    expect((decoded as Right<Error, Config>).value).toStrictEqual(config)
  })
})
