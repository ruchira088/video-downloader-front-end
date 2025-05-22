import { FileResource, FileResourceType } from "./FileResource"
import { z } from "zod/v4"
import { ZodDuration } from "~/types/Zod"

export const Snapshot = z.object({
  videoId: z.string(),
  fileResource: FileResource(FileResourceType.Snapshot),
  videoTimestamp: ZodDuration
})

export type Snapshot = z.infer<typeof Snapshot>