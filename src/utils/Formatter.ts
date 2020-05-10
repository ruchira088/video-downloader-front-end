import {Maybe, None, Some} from "monet";

interface ByteSize {
    floor: number
    suffix: string
}

const BYTE: ByteSize = {
    floor: 1,
    suffix: "B"
}

const KILO_BYTE: ByteSize = {
    floor: 1000,
    suffix: "kB"
}

const MEGA_BYTE: ByteSize = {
    floor: 1000 * KILO_BYTE.floor,
    suffix: "MB"
}

const GIGA_BYTE: ByteSize = {
    floor: 1000 * MEGA_BYTE.floor,
    suffix: "GB"
}

interface Duration {
    seconds: number
    suffix: string
}

const Hour: Duration = {
    seconds: 3600,
    suffix: "hours"
}

const Minute: Duration = {
    seconds: 60,
    suffix: "minutes"
}

const Second: Duration = {
    seconds: 1,
    suffix: "seconds"
}

export const humanReadableSize =
    (size: number): string => {
        const byteSize =
            Maybe.fromUndefined([GIGA_BYTE, MEGA_BYTE, KILO_BYTE].find(byteSize => byteSize.floor < size))
                .getOrElse(BYTE)

        return `${(size / byteSize.floor).toFixed(2)}${byteSize.suffix}`
    }

const displaySingleDuration =
    (value: number, duration: Duration): Maybe<string> =>
        (value === 0) ? None() : Some(`${value} ${duration.suffix}`)

export const humanReadableDuration =
    (duration: number): string => {
        const hours = Math.floor(duration / Hour.seconds)
        const minutes = Math.floor((duration % Hour.seconds) / Minute.seconds)
        const seconds = Math.floor(duration % Minute.seconds)

        const values = [
            displaySingleDuration(hours, Hour),
            displaySingleDuration(minutes, Minute),
            displaySingleDuration(seconds, Second)
        ]

        return values.reduce<string[]>((acc, value) => value.fold(acc)(text => acc.concat(text)), []).join(" ")
    }
