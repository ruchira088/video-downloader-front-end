import {Duration} from "luxon"
import {Option} from "~/types/Option"

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

export const humanReadableSize = (rawSize: number, alwaysShowDecimals = false, separator: string = ""): string => {
  // A missing or corrupt size would otherwise render as "NaNGB".
  const size = Number.isFinite(rawSize) ? rawSize : 0

  const format = (byteSize: ByteSize): string =>
    (size / byteSize.floor).toFixed(byteSize.unit === GIGA_BYTE.unit || alwaysShowDecimals ? 2 : 0)

  // Pick the unit from the rounded value, so 999999 bytes reads "1MB" rather than "1000kB".
  const byteSize = Option.fromNullable(
    [BYTE, KILO_BYTE, MEGA_BYTE].find((byteSize) => Number(format(byteSize)) < 1000)
  ).getOrElse(() => GIGA_BYTE)

  return `${format(byteSize)}${separator}${byteSize.unit}`
}


type HoursMinutesSeconds = {
  readonly hours: number
  readonly minutes: number
  readonly seconds: number
}

// Not Duration.rescale(): that promotes into days, weeks and months, which these formats don't show.
const toHoursMinutesSeconds = (duration: Duration): HoursMinutesSeconds => {
  const seconds = duration.as("seconds")
  // An invalid Duration reports NaN, which would otherwise render as "NaN:NaN".
  const totalSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0

  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  }
}

export const humanReadableDuration = (duration: Duration): string => {
  const {hours, minutes, seconds} = toHoursMinutesSeconds(duration)

  const parts = ([[hours, "hour"], [minutes, "minute"], [seconds, "second"]] as const)
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value} ${unit}${value > 1 ? "s" : ""}`)

  return parts.length === 0 ? "0 seconds" : parts.join(" ")
}

export const shortHumanReadableDuration = (duration: Duration): string => {
  const {hours, minutes, seconds} = toHoursMinutesSeconds(duration)

  if (hours >= 1) {
    return `${hours}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`
  } else {
    return `${minutes}:${formatTwoDigits(seconds)}`
  }
}

// For columns of totals: whole hours ("2,610 h") read better than "2610 hours 18 minutes"; under an hour shows minutes.
export const compactDuration = (duration: Duration): string => {
  const {hours, minutes} = toHoursMinutesSeconds(duration)

  return hours >= 1 ? `${Math.round(hours + minutes / 60).toLocaleString()} h` : `${minutes} min`
}

const formatTwoDigits = (number: number): string => String(number).padStart(2, "0")
