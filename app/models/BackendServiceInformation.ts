import { z } from "zod/v4"
import { ZodDateTime, ZodOptional } from "~/types/Zod"

export const BackendServiceInformation = z.object({
  serviceName: z.string(),
  serviceVersion: z.string(),
  organization: z.string(),
  scalaVersion: z.string(),
  sbtVersion: z.string(),
  javaVersion: z.string(),
  currentTimestamp: ZodDateTime,
  gitBranch: ZodOptional(z.string()),
  gitCommit: ZodOptional(z.string()),
  buildTimestamp: ZodOptional(ZodDateTime)
})

export type BackendServiceInformation = z.infer<typeof BackendServiceInformation>
