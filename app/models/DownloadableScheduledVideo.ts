import {ScheduledVideoDownload} from "~/models/ScheduledVideoDownload"
import {z} from "zod/v4"
import {ZodDateTime, ZodOptional} from "~/types/Zod"

export const Downloadable = z.object({
  downloadedBytes: z.number(),
  lastUpdatedAt: ZodOptional(ZodDateTime),
  downloadHistory: z.array(z.number()),
  downloadSpeed: ZodOptional(z.number()),
})

export type Downloadable = z.infer<typeof Downloadable>

export const DownloadableScheduledVideo = Downloadable.and(ScheduledVideoDownload)

export type DownloadableScheduledVideo = z.infer<typeof DownloadableScheduledVideo>