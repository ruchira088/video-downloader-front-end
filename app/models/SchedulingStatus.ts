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
}

export const TRANSITION_STATES: { [key: string]: SchedulingStatus[] } = {
  [SchedulingStatus.Active]: [SchedulingStatus.Paused],
  [SchedulingStatus.Error]: [SchedulingStatus.Queued],
  [SchedulingStatus.Paused]: [SchedulingStatus.Queued],
  [SchedulingStatus.Queued]: [SchedulingStatus.Paused],
}

export const COMMAND_NAMES: { [key: string]: string } = {
  [SchedulingStatus.Paused]: "Pause",
  [SchedulingStatus.Queued]: "Queue",
}
