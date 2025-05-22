import { Duration } from "luxon"
import type { Range } from "./Range"
import { decodeMap, type Decoder, encodeMap, type Encoder, stringToNumberDecoder } from "./Codec"
import { type Either, Right } from "~/types/Either"

export type DurationRange = Range<Duration>

export const durationRangeNumberEncoder: Encoder<Duration, number> = {
  encode(value: Duration): number {
    return value.as("minutes")
  },
}

export const durationRangeNumberDecoder: Decoder<number, Duration> = {
  decode(value: number): Either<Error, Duration> {
    return Right.of(Duration.fromObject({minutes: value}))
  },
}

export const durationRangeStringEncoder: Encoder<Duration, string> = encodeMap(durationRangeNumberEncoder, (value) =>
  value.toString(10)
)

export const durationRangeDecoder: Decoder<string, Duration> = decodeMap(stringToNumberDecoder, (number) =>
  Duration.fromObject({minutes: number})
)
