import {z} from "zod/v4"
import { ZodDateTime, ZodOptional } from "~/types/Zod"

export enum ScanStatus {
  Idle = "Idle",
  Scheduled = "Scheduled",
  InProgress = "InProgress",
  Error = "Error"
}

export const VideoScan = z.object({
  updatedAt: ZodOptional(ZodDateTime),
  scanStatus: z.enum(ScanStatus),
})

export type VideoScan = z.infer<typeof VideoScan>