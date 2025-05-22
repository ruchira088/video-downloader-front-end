import {z} from "zod/v4"
import { ZodDateTime } from "~/types/Zod"

export const DownloadProgress = z.object({
  videoId: z.string(),
  updatedAt: ZodDateTime,
  bytes: z.number(),
})

export type DownloadProgress = z.infer<typeof DownloadProgress>