import { z } from "zod/v4"
import { ZodDateTime } from "~/types/Zod"

export const DuplicateVideo = z.object({
  videoId: z.string(),
  duplicateGroupId: z.string(),
  createdAt: ZodDateTime,
})

export type DuplicateVideo = z.infer<typeof DuplicateVideo>

export const DuplicateVideoGroups = z.record(z.string(), z.array(DuplicateVideo))

export type DuplicateVideoGroups = z.infer<typeof DuplicateVideoGroups>
