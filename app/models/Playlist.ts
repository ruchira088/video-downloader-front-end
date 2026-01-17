import { z } from "zod/v4"
import { ZodDateTime, ZodOptional } from "~/types/Zod"
import { Video } from "./Video"
import { FileResource, FileResourceType } from "./FileResource"

export const Playlist = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: ZodDateTime,
  title: z.string(),
  description: z.string().nullable().optional(),
  videos: z.array(Video),
  albumArt: ZodOptional(FileResource(FileResourceType.AlbumArt))
})

export type Playlist = z.infer<typeof Playlist>
