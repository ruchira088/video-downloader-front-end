export enum SchedulingStatus {
  Active = "Active",
  Completed = "Completed",
  Error = "Error",
  Paused = "Paused",
  Queued = "Queued",
  SchedulerPaused = "SchedulerPaused",
}

export const TRANSITION_STATES: { [key: string]: SchedulingStatus[] } = {
  [SchedulingStatus.Active]: [SchedulingStatus.Paused],
  [SchedulingStatus.Completed]: [],
  [SchedulingStatus.Error]: [SchedulingStatus.Queued],
  [SchedulingStatus.Paused]: [SchedulingStatus.Queued],
  [SchedulingStatus.Queued]: [SchedulingStatus.Paused],
  [SchedulingStatus.SchedulerPaused]: [SchedulingStatus.Paused],
}

export const COMMAND_NAMES: { [key: string]: string } = {
  [SchedulingStatus.Paused]: "Pause",
  [SchedulingStatus.Queued]: "Queue",
}
