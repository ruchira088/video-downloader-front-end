import {VideoMetadata} from "./VideoMetadata"
import {FileResource, FileResourceType} from "./FileResource"
import {z} from "zod/v4"
import {ZodDateTime, ZodDuration} from "~/types/Zod"

export const Video = z.object({
  videoMetadata: VideoMetadata,
  fileResource: FileResource(FileResourceType.Video),
  createdAt: ZodDateTime,
  watchTime: ZodDuration
})

export type Video = z.infer<typeof Video>