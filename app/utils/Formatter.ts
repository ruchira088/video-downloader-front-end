import { Duration, type DurationUnit } from "luxon"
import { Option } from "~/types/Option"

type ByteUnit = "B" | "kB" | "MB" | "GB"

type ByteSize = {
  readonly floor: number
  readonly unit: ByteUnit
}

const BYTE: ByteSize = {
  floor: 1,
  unit: "B",
}

const KILO_BYTE: ByteSize = {
  floor: 1000,
  unit: "kB",
}

const MEGA_BYTE: ByteSize = {
  floor: 1000 * KILO_BYTE.floor,
  unit: "MB",
}

const GIGA_BYTE: ByteSize = {
  floor: 1000 * MEGA_BYTE.floor,
  unit: "GB",
}

export const humanReadableSize = (size: number, alwaysShowDecimals = false): string => {
  const byteSize = Option.fromNullable(
    [GIGA_BYTE, MEGA_BYTE, KILO_BYTE].find((byteSize) => byteSize.floor < size)
  ).getOrElse(() => BYTE)

  return `${(size / byteSize.floor).toFixed(byteSize.unit === GIGA_BYTE.unit || alwaysShowDecimals ? 2 : 0)}${
    byteSize.unit
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
  const rescaledDuration = duration.rescale()

  if (rescaledDuration.hours >= 1) {
    return `${rescaledDuration.hours}:${formatTwoDigits(rescaledDuration.minutes)}:${formatTwoDigits(rescaledDuration.seconds)}`
  } else {
    return `${rescaledDuration.minutes}:${formatTwoDigits(rescaledDuration.seconds)}`
  }
}

const formatTwoDigits = (number: number): string => (number < 10 ? `0${number}` : number.toString())
