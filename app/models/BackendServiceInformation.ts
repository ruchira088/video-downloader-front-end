import { z } from "zod/v4"
import { ZodDateTime, ZodOptional } from "~/types/Zod"

export const BackendServiceInformation = z.object({
  serviceName: z.string(),
  organization: z.string(),
  scalaVersion: z.string(),
  sbtVersion: z.string(),
  javaVersion: z.string(),
  "yt-dlpVersion": z.string(),
  currentTimestamp: ZodDateTime,
  gitBranch: ZodOptional(z.string()),
  gitCommit: ZodOptional(z.string()),
  buildTimestamp: ZodOptional(ZodDateTime)
}).transform(({"yt-dlpVersion": ytDlpVersion, ...rest}) => ({...rest, ytDlpVersion}))

export type BackendServiceInformation = z.infer<typeof BackendServiceInformation>
