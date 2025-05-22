import { z } from "zod/v4"
import { ZodDateTime } from "~/types/Zod"

export const BackendServiceInformation = z.object({
  serviceName: z.string(),
  serviceVersion: z.string(),
  organization: z.string(),
  scalaVersion: z.string(),
  sbtVersion: z.string(),
  javaVersion: z.string(),
  currentTimestamp: ZodDateTime,
  gitBranch: z.string().nullish(),
  gitCommit: z.string().nullish(),
  buildTimestamp: ZodDateTime.nullish()
})

export type BackendServiceInformation = z.infer<typeof BackendServiceInformation>
