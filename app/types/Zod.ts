import { z } from "zod/v4"
import { DateTime, Duration } from "luxon"
import { Option } from "~/types/Option"
import { reportError } from "~/services/ErrorReporting"

export const ZodDuration: z.ZodSchema<Duration> =
  z.object({ length: z.number(), unit: z.string() })
    .transform(({ length, unit }) => Duration.fromObject({ [unit]: length }))

export const ZodDateTime = z.iso.datetime({ offset: true }).transform(value => DateTime.fromISO(value))

export const ZodOptional = <A>(type: z.ZodType<A>) => type.nullish().transform(Option.fromNullable)

export const zodParse = <A>(type: z.ZodType<A>, value: unknown): A => {
  try {
    return type.parse(value)
  } catch (error) {
    reportError("Failed to parse an API response", error)
    throw error
  }
}