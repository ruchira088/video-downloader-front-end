import { VideoMetadata } from "./VideoMetadata"
import { SchedulingStatus } from "./SchedulingStatus"
import { z } from "zod/v4"
import { ZodDateTime } from "~/types/Zod"

export const ScheduledVideoDownload = z.object({
  scheduledAt: ZodDateTime,
  videoMetadata: VideoMetadata,
  status: z.enum(SchedulingStatus),
  downloadedBytes: z.number(),
  completedAt: ZodDateTime.nullish()
})

export type ScheduledVideoDownload = z.infer<typeof ScheduledVideoDownload>