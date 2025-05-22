import { z } from "zod/v4"
import { ZodDateTime } from "~/types/Zod"

export enum FileResourceType {
  Thumbnail = "thumbnail",
  Snapshot = "snapshot",
  Video = "video",
}

export const FileResource = <A extends FileResourceType>(fileResourceType: A) => z.object({
  id: z.string(),
  createdAt: ZodDateTime,
  path: z.string(),
  mediaType: z.string(),
  size: z.number()
}).transform(value => ({ ...value, type: fileResourceType }))

export type FileResource<A extends FileResourceType> = z.infer<ReturnType<typeof FileResource<A>>>