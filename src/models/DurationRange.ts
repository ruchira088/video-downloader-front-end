import { Duration, duration } from "moment"
import { Range, RangeDecoder, RangeEncoder } from "./Range"

export type DurationRange = Range<Duration>

export const durationRangeEncoder: RangeEncoder<Duration> = {
  encode(value: Duration): number {
    return value.asMinutes()
  }
}

export const durationRangeDecoder: RangeDecoder<Duration> = {
  decode(value: number): Duration {
    return duration(value, "minutes")
  }
}
