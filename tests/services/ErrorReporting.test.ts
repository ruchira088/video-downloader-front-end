import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { AxiosError, AxiosHeaders, CanceledError } from "axios"
import { reportError, shouldReport } from "~/services/ErrorReporting"

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

const axiosErrorWithStatus = (status: number): AxiosError =>
  new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: undefined,
  })

describe("shouldReport", () => {
  test("should skip requests the app cancelled", () => {
    expect(shouldReport(new CanceledError())).toBe(false)
    expect(shouldReport(new DOMException("The operation was aborted.", "AbortError"))).toBe(false)
  })

  test("should skip 401 responses, which the HTTP client already handles", () => {
    expect(shouldReport(axiosErrorWithStatus(401))).toBe(false)
  })

  test("should report server errors, network errors and anything else", () => {
    expect(shouldReport(axiosErrorWithStatus(500))).toBe(true)
    expect(shouldReport(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(true)
    expect(shouldReport(new DOMException("Quota exceeded", "QuotaExceededError"))).toBe(true)
    expect(shouldReport(new Error("boom"))).toBe(true)
    expect(shouldReport(undefined)).toBe(true)
  })

  test("should still log a skipped failure without sending it to Sentry", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const error = axiosErrorWithStatus(401)

    reportError("Failed to load videos", error)

    expect(consoleWarnSpy).toHaveBeenCalledWith("Failed to load videos", error)
    expect(mockCaptureException).not.toHaveBeenCalled()
    consoleWarnSpy.mockRestore()
  })
})
