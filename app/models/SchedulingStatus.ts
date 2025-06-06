import {None, type Option, Some} from "~/types/Option"

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

export const getActionName = (current: SchedulingStatus, next: SchedulingStatus): Option<string> => {
  if (next === SchedulingStatus.Paused) {
    return Some.of("Pause")
  } else if (current === SchedulingStatus.Error && next === SchedulingStatus.Queued) {
    return Some.of("Retry")
  } else if (next === SchedulingStatus.Queued) {
    return Some.of("Resume")
  } else {
    return None.of()
  }
}