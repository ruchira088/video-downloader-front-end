import { VideoMetadata } from "./VideoMetadata"
import { SchedulingStatus } from "./SchedulingStatus"
import { z } from "zod/v4"
import { ZodDateTime, ZodOptional } from "~/types/Zod"

export const ScheduledVideoDownload = z.object({
  scheduledAt: ZodDateTime,
  videoMetadata: VideoMetadata,
  status: z.enum(SchedulingStatus),
  downloadedBytes: z.number(),
  completedAt: ZodOptional(ZodDateTime)
})

export type ScheduledVideoDownload = z.infer<typeof ScheduledVideoDownload>