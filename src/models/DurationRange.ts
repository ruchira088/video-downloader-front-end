import { Duration, duration } from "moment"
import Range from "./Range"
import { decodeMap, Decoder, encodeMap, Encoder, stringToNumberDecoder } from "./Codec"
import { Either, Right } from "monet"

export type DurationRange = Range<Duration>

export const durationRangeNumberEncoder: Encoder<Duration, number> = {
  encode(value: Duration): number {
    return value.asMinutes()
  }
}

export const durationRangeNumberDecoder: Decoder<number, Duration> = {
  decode(value: number): Either<Error, Duration> {
    return Right(duration(value, "minutes"));
  }
}

export const durationRangeStringEncoder: Encoder<Duration, string> =
  encodeMap(durationRangeNumberEncoder, value => value.toString(10))

export const durationRangeDecoder: Decoder<string, Duration> =
  decodeMap(stringToNumberDecoder, number => duration(number, "minutes"))