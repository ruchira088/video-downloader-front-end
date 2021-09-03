import { Duration, duration } from "moment"
import { Range } from "./Range"
import { decodeMap, Decoder, encodeMap, Encoder, stringToNumberDecoder } from "./Codec"

export type DurationRange = Range<Duration>

export const durationRangeNumberEncoder: Encoder<Duration, number> = {
  encode(value: Duration): number {
    return value.asMinutes()
  }
}

export const durationRangeStringEncoder: Encoder<Duration, string> =
  encodeMap(durationRangeNumberEncoder, value => value.toString(10))

export const durationRangeDecoder: Decoder<string, Duration> =
  decodeMap(stringToNumberDecoder, number => duration(number, "minutes"))
