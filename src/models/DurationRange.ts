import { Just, Maybe, None } from "monet"
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

export const fromString = (input: string): Maybe<DurationRange> => {
  const [minString, maxString] = input.split('-')

  const min = parseInt(minString, 10)
  const maybeMax = Maybe.fromNull(maxString).map(value => parseInt(value, 10))

  return Just({ min: duration(min, "minutes"), max: maybeMax.map(value => duration(value, "minutes")) })
}
