import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { reportError } from "~/services/ErrorReporting"

const mockCaptureException = vi.fn()

vi.mock("@sentry/react", () => ({
  captureException: (error: unknown, context: unknown) => mockCaptureException(error, context),
}))

describe("reportError", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  test("should log the failure and capture it tagged with the operation", () => {
    const error = new Error("boom")

    reportError("Failed to save the playlist", error)

    expect(consoleWarnSpy).toHaveBeenCalledWith("Failed to save the playlist", error)
    expect(mockCaptureException).toHaveBeenCalledWith(error, { tags: { operation: "Failed to save the playlist" } })
  })

  test("should log at warn level so the console integration does not capture it a second time", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    reportError("Failed to save the playlist", new Error("boom"))

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  test("should capture an Error named after the operation when no error is given", () => {
    reportError("Scheduled video download stream disconnected", undefined)

    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Scheduled video download stream disconnected" }),
      { tags: { operation: "Scheduled video download stream disconnected" } }
    )
  })
})
