import { VideoMetadata } from "./VideoMetadata"
import { SchedulingStatus } from "./SchedulingStatus"
import { z } from "zod/v4"
import { ZodDateTime, ZodOptional } from "~/types/Zod"

const ErrorInformation = z.object({
  message: z.string(),
  details: z.string(),
}).transform(value => ({
  message: value.message,
  stackTrace: value.details.split("\\\n")
}))

export const ScheduledVideoDownload = z.object({
  lastUpdatedAt: ZodDateTime,
  scheduledAt: ZodDateTime,
  videoMetadata: VideoMetadata,
  errorInfo: ErrorInformation.nullish(),
  status: z.enum(SchedulingStatus),
  downloadedBytes: z.number(),
  completedAt: ZodOptional(ZodDateTime)
})

export type ScheduledVideoDownload = z.infer<typeof ScheduledVideoDownload>