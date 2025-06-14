import {z} from "zod/v4"
import {Duration} from "luxon"

export enum HealthStatus {
  Healthy = "Healthy",
  Unhealthy = "Unhealthy"
}

const HealthCheckStatusDetails = z.object({
  durationInMs: z.number().int(),
  healthStatus: z.enum(HealthStatus)
}).transform((value) => ({
    healthStatus: value.healthStatus,
    duration: Duration.fromMillis(value.durationInMs)
  })
)

export type HealthCheckStatusDetails = z.infer<typeof HealthCheckStatusDetails>

const FileHealthStatusDetails = z.object({
  filePath: z.string(),
  healthStatusDetails: HealthCheckStatusDetails
})

export type FileHealthStatusDetails = z.infer<typeof FileHealthStatusDetails>

export const FileRepositoryHealthStatusDetails = z.object({
  imageFolder: FileHealthStatusDetails,
  videoFolder: FileHealthStatusDetails,
  otherVideoFolders: z.array(FileHealthStatusDetails).nullish()
})

export type FileRepositoryHealthStatusDetails = z.infer<typeof FileRepositoryHealthStatusDetails>

export const HealthCheck = z.object({
  database: HealthCheckStatusDetails,
  fileRepository: FileRepositoryHealthStatusDetails,
  keyValueStore: HealthCheckStatusDetails,
  pubSub: HealthCheckStatusDetails,
  spaRenderer: HealthCheckStatusDetails,
  internetConnectivity: HealthCheckStatusDetails
})

export type HealthCheck = z.infer<typeof HealthCheck>