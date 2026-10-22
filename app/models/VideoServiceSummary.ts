import { z } from "zod/v4"
import { ZodDuration } from "~/types/Zod"

export const VideoSiteSummary = z.object({
  site: z.string(),
  videoCount: z.number(),
  totalSize: z.number(),
  totalDuration: ZodDuration,
  // Summed across every user's viewing
  watchTime: ZodDuration
})

export type VideoSiteSummary = z.infer<typeof VideoSiteSummary>

export const VideoServiceSummary = z.object({
  videoCount: z.number(),
  totalSize: z.number(),
  totalDuration: ZodDuration,
  sites: z.array(z.string()),
  // Defaults to empty so the page still works against an API that predates the breakdown.
  siteBreakdown: z.array(VideoSiteSummary).default([])
})

export type VideoServiceSummary = z.infer<typeof VideoServiceSummary>
