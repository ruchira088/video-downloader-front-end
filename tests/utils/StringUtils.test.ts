import { describe, expect, test } from "vitest"
import { maybeString } from "~/utils/StringUtils"
import { None, Some } from "~/types/Option"

describe("mayBeString", () => {
  test("should return None for empty string", () => {
    expect(maybeString("")).toStrictEqual(None.of())
  })

  test("should return Some for non-empty string", () => {
    expect(maybeString("test")).toStrictEqual(Some.of("test"))
  })
})