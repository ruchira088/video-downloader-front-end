import { FileResource, FileResourceType } from "./FileResource"
import { z } from "zod/v4"
import { ZodDuration } from "~/types/Zod"

export const VideoMetadata = z.object({
  url: z.string(),
  id: z.string(),
  videoSite: z.string(),
  title: z.string(),
  duration: ZodDuration,
  size: z.number(),
  thumbnail: FileResource(FileResourceType.Thumbnail),
})

export type VideoMetadata = z.infer<typeof VideoMetadata>