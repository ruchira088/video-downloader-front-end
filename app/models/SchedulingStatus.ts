export enum SchedulingStatus {
  Active = "Active",
  Completed = "Completed",
  Downloaded = "Downloaded",
  Acquired = "Acquired",
  Stale = "Stale",
  Error = "Error",
  WorkersPaused = "WorkersPaused",
  Paused = "Paused",
  Queued = "Queued",
  Deleted = "Deleted"
}

export const TRANSITION_STATES: Partial<Record<SchedulingStatus, SchedulingStatus[]>> = {
  [SchedulingStatus.Active]: [SchedulingStatus.Paused],
  [SchedulingStatus.Error]: [SchedulingStatus.Queued],
  [SchedulingStatus.Paused]: [SchedulingStatus.Queued],
  [SchedulingStatus.Queued]: [SchedulingStatus.Paused]
}

export const COMMAND_NAMES: Partial<Record<SchedulingStatus, string>> = {
  [SchedulingStatus.Paused]: "Pause",
  [SchedulingStatus.Queued]: "Retry",
}
