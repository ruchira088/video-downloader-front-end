import { Maybe, None } from "monet"
import { Duration } from "moment"

export interface DurationRange {
  min: Maybe<Duration>
  max: Maybe<Duration>
}

export const ALL: DurationRange = { min: None(), max: None() }

export const durationRangeQueryParameter = (durationRange: DurationRange): string =>
  durationRange.min.map((duration) => duration.asMinutes().toString(10)).getOrElse("") +
  "-" +
  durationRange.max.map((duration) => duration.asMinutes().toString(10)).getOrElse("")
