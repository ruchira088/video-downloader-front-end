import { Duration, type DurationUnit } from "luxon"
import { Option } from "~/types/Option"

interface ByteSize {
  readonly floor: number
  readonly suffix: string
}

const BYTE: ByteSize = {
  floor: 1,
  suffix: "B",
}

const KILO_BYTE: ByteSize = {
  floor: 1000,
  suffix: "kB",
}

const MEGA_BYTE: ByteSize = {
  floor: 1000 * KILO_BYTE.floor,
  suffix: "MB",
}

const GIGA_BYTE: ByteSize = {
  floor: 1000 * MEGA_BYTE.floor,
  suffix: "GB",
}

export const humanReadableSize = (size: number, alwaysShowDecimals = false): string => {
  const byteSize = Option.fromNullable(
    [GIGA_BYTE, MEGA_BYTE, KILO_BYTE].find((byteSize) => byteSize.floor < size)
  ).getOrElse(() => BYTE)

  return `${(size / byteSize.floor).toFixed(byteSize.suffix === GIGA_BYTE.suffix || alwaysShowDecimals ? 2 : 0)}${
    byteSize.suffix
  }`
}


export const humanReadableDuration = (duration: Duration): string =>
  (["hours", "minutes", "seconds"] as DurationUnit[])
    .reduce<{ remainingDuration: Duration; results: string[] }>(
      ({ remainingDuration, results }, unit) => {
        const unitLength = remainingDuration.as(unit)

        if (unitLength > 0) {
          return {
            remainingDuration: remainingDuration.minus(Duration.fromObject({[unit]: unitLength})),
            results: results.concat(`${unitLength} ${unit}`),
          }
        } else {
          return { remainingDuration, results }
        }
      },
      { remainingDuration: duration, results: [] }
    )
    .results.join(" ")

export const shortHumanReadableDuration = (duration: Duration): string => {
  const hasHours = duration.as("hours") >= 1

  const result =
    (hasHours ? `${duration.as("hours")}:` : "") +
    (hasHours ? formatTwoDigits(duration.as("minutes")) : duration.as("minutes")) +
    ":" +
    formatTwoDigits(duration.as("seconds"))

  return result
}

const formatTwoDigits = (number: number): string => (number < 10 ? `0${number}` : number.toString())
