import type {ScheduledVideoDownload} from "~/models/ScheduledVideoDownload"
import {z} from "zod/v4"
import {ZodDateTime, ZodOptional} from "~/types/Zod"

export const Downloadable = z.object({
  downloadedBytes: z.number(),
  lastUpdatedAt: ZodDateTime,
  downloadHistory: z.array(z.number()),
  downloadSpeed: ZodOptional(z.number()),
})

export type Downloadable = z.infer<typeof Downloadable>

export type DownloadableScheduledVideo = Downloadable & ScheduledVideoDownload