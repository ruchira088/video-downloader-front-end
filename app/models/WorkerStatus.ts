import { z } from "zod/v4"

export enum WorkerStatus {
  Paused = "Paused",
  Available = "Available",
}

export const WorkerStatusResult = z.object({
  workerStatus: z.enum(WorkerStatus),
})

