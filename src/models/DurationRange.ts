import { Maybe, None } from "monet"
import { Duration, duration } from "moment"

export interface DurationRange {
  min: Duration
  max: Maybe<Duration>
}

export const ALL_DURATIONS: DurationRange = { min: duration(0, "minutes"), max: None() }

export const toNumberRange = (durationRange: DurationRange, maximum: Duration): number[] => [
  durationRange.min.asMinutes(),
  durationRange.max.map((duration) => duration.asMinutes()).getOrElse(maximum.asMinutes()),
]

export const durationRangeQueryParameter = (durationRange: DurationRange): string =>
  durationRange.min.asMinutes() +
  "-" +
  durationRange.max.map((duration) => duration.asMinutes().toString(10)).getOrElse("")
