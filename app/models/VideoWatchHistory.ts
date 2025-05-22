import { z } from "zod/v4"
import { Video } from "./Video"
import { ZodDateTime, ZodDuration } from "~/types/Zod"

export const VideoWatchHistory = z.object({
  id: z.string(),
  duration: ZodDuration,
  userId: z.string(),
  createdAt: ZodDateTime,
  lastUpdatedAt: ZodDateTime,
  video: Video,
})

export type VideoWatchHistory = z.infer<typeof VideoWatchHistory>