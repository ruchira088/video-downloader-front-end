import { describe, expect, test } from "vitest"
import { Some, None } from "~/types/Option"
import {
  SchedulingStatus,
  TRANSITION_STATES,
  getActionName,
} from "~/models/SchedulingStatus"

describe("SchedulingStatus", () => {
  describe("SchedulingStatus enum", () => {
    test("should have all expected values", () => {
      expect(SchedulingStatus.Active).toBe("Active")
      expect(SchedulingStatus.Completed).toBe("Completed")
      expect(SchedulingStatus.Downloaded).toBe("Downloaded")
      expect(SchedulingStatus.Acquired).toBe("Acquired")
      expect(SchedulingStatus.Stale).toBe("Stale")
      expect(SchedulingStatus.Error).toBe("Error")
      expect(SchedulingStatus.WorkersPaused).toBe("WorkersPaused")
      expect(SchedulingStatus.Paused).toBe("Paused")
      expect(SchedulingStatus.Queued).toBe("Queued")
      expect(SchedulingStatus.Deleted).toBe("Deleted")
    })
  })

  describe("TRANSITION_STATES", () => {
    test("should allow Active to transition to Paused", () => {
      const transitions = TRANSITION_STATES[SchedulingStatus.Active]
      expect(transitions).toContain(SchedulingStatus.Paused)
    })

    test("should allow Error to transition to Queued", () => {
      const transitions = TRANSITION_STATES[SchedulingStatus.Error]
      expect(transitions).toContain(SchedulingStatus.Queued)
    })

    test("should allow Paused to transition to Queued", () => {
      const transitions = TRANSITION_STATES[SchedulingStatus.Paused]
      expect(transitions).toContain(SchedulingStatus.Queued)
    })

    test("should allow Queued to transition to Paused", () => {
      const transitions = TRANSITION_STATES[SchedulingStatus.Queued]
      expect(transitions).toContain(SchedulingStatus.Paused)
    })

    test("should not have transitions for Completed", () => {
      expect(TRANSITION_STATES[SchedulingStatus.Completed]).toBeUndefined()
    })

    test("should not have transitions for Downloaded", () => {
      expect(TRANSITION_STATES[SchedulingStatus.Downloaded]).toBeUndefined()
    })

    test("should not have transitions for Deleted", () => {
      expect(TRANSITION_STATES[SchedulingStatus.Deleted]).toBeUndefined()
    })
  })

  describe("getActionName", () => {
    describe("Pause action", () => {
      test("should return 'Pause' when transitioning to Paused from Active", () => {
        const result = getActionName(SchedulingStatus.Active, SchedulingStatus.Paused)
        expect(result).toBeInstanceOf(Some)
        result.forEach((name) => expect(name).toBe("Pause"))
      })

      test("should return 'Pause' when transitioning to Paused from Queued", () => {
        const result = getActionName(SchedulingStatus.Queued, SchedulingStatus.Paused)
        expect(result).toBeInstanceOf(Some)
        result.forEach((name) => expect(name).toBe("Pause"))
      })
    })

    describe("Retry action", () => {
      test("should return 'Retry' when transitioning from Error to Queued", () => {
        const result = getActionName(SchedulingStatus.Error, SchedulingStatus.Queued)
        expect(result).toBeInstanceOf(Some)
        result.forEach((name) => expect(name).toBe("Retry"))
      })
    })

    describe("Resume action", () => {
      test("should return 'Resume' when transitioning from Paused to Queued", () => {
        const result = getActionName(SchedulingStatus.Paused, SchedulingStatus.Queued)
        expect(result).toBeInstanceOf(Some)
        result.forEach((name) => expect(name).toBe("Resume"))
      })

      test("should return 'Resume' for any non-Error to Queued transition", () => {
        const result = getActionName(SchedulingStatus.Active, SchedulingStatus.Queued)
        expect(result).toBeInstanceOf(Some)
        result.forEach((name) => expect(name).toBe("Resume"))
      })
    })

    describe("No action", () => {
      test("should return None for unsupported transition to Completed", () => {
        const result = getActionName(SchedulingStatus.Active, SchedulingStatus.Completed)
        expect(result).toBeInstanceOf(None)
      })

      test("should return None for transition to Downloaded", () => {
        const result = getActionName(SchedulingStatus.Active, SchedulingStatus.Downloaded)
        expect(result).toBeInstanceOf(None)
      })

      test("should return None for transition to Error", () => {
        const result = getActionName(SchedulingStatus.Active, SchedulingStatus.Error)
        expect(result).toBeInstanceOf(None)
      })

      test("should return None for transition to Active", () => {
        const result = getActionName(SchedulingStatus.Paused, SchedulingStatus.Active)
        expect(result).toBeInstanceOf(None)
      })

      test("should return None for transition to Deleted", () => {
        const result = getActionName(SchedulingStatus.Active, SchedulingStatus.Deleted)
        expect(result).toBeInstanceOf(None)
      })
    })
  })
})
