import { z } from "zod/v4"
import { DateTime, Duration } from "luxon"

export const ZodDuration: z.ZodSchema<Duration> =
  z.object({ length: z.number(), unit: z.string() })
    .transform(({ length, unit }) => Duration.fromObject({ [unit]: length }))

export const ZodDateTime = z.iso.datetime({ offset: true }).transform(value => DateTime.fromISO(value))