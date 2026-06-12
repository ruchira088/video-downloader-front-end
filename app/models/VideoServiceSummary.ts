import { z } from "zod/v4"
import { ZodDuration } from "~/types/Zod"

export const VideoServiceSummary = z.object({
  videoCount: z.number(),
  totalSize: z.number(),
  totalDuration: ZodDuration,
  sites: z.array(z.string())
})

export type VideoServiceSummary = z.infer<typeof VideoServiceSummary>