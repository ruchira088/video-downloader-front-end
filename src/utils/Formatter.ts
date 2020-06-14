import {Maybe} from "monet";
import moment, {Duration, unitOfTime} from "moment";

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

export const humanReadableSize =
    (size: number): string => {
        const byteSize =
            Maybe.fromUndefined([GIGA_BYTE, MEGA_BYTE, KILO_BYTE].find(byteSize => byteSize.floor < size))
                .getOrElse(BYTE)

        return `${(size / byteSize.floor).toFixed(2)}${byteSize.suffix}`
    }

export const humanReadableDuration =
    (duration: Duration): string =>
        (["hours", "minutes", "seconds"] as unitOfTime.Base[])
            .reduce<{ remainingDuration: Duration, results: string[] }>(
                ({remainingDuration, results}, unit) => {
                    const unitLength = remainingDuration.get(unit)

                    if (unitLength > 0) {
                        return {
                            remainingDuration: remainingDuration.subtract(moment.duration(unitLength, unit)),
                            results: results.concat(`${unitLength} ${unit}`)
                        }
                    } else {
                        return ({remainingDuration, results})
                    }
                }
                ,
                {remainingDuration: duration, results: []}
            )
            .results
            .join(" ")

export const shortHumanReadableDuration =
    (duration: Duration) =>
        ((Math.floor(duration.asHours()) >= 1) ? `${duration.hours()}:` : "") + `${duration.minutes()}:${duration.seconds()}`
