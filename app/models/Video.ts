import {VideoMetadata} from "./VideoMetadata"
import { FileResource, FileResourceType } from "./FileResource"
import { z } from "zod/v4"
import { ZodDuration } from "~/types/Zod"

export const Video = z.object({
  videoMetadata: VideoMetadata,
  fileResource: FileResource(FileResourceType.Video),
  watchTime: ZodDuration
})

export type Video = z.infer<typeof Video>