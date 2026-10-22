import { describe, expect, test, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import WorkerStatusButton from "~/components/worker-status/WorkerStatusButton"
import { WorkerStatus } from "~/models/WorkerStatus"

vi.mock("~/services/scheduling/SchedulingService", () => ({
  fetchWorkerStatus: vi.fn(),
  updateWorkerStatus: vi.fn(),
}))

import { fetchWorkerStatus, updateWorkerStatus } from "~/services/scheduling/SchedulingService"

const mockFetchWorkerStatus = vi.mocked(fetchWorkerStatus)
const mockUpdateWorkerStatus = vi.mocked(updateWorkerStatus)

describe("WorkerStatusButton", () => {
  test("should stay disabled until the worker status has loaded", () => {
    mockFetchWorkerStatus.mockReturnValue(new Promise(() => {}))

    render(<WorkerStatusButton />)

    expect(screen.getByRole("button", { name: "Pause Downloads" })).toBeDisabled()
  })

  test("should offer to pause downloads while the workers are available", async () => {
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Available)

    render(<WorkerStatusButton />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Pause Downloads" })).toBeInTheDocument()
    })
  })

  test("should call updateWorkerStatus to pause when currently available", async () => {
    const user = userEvent.setup()
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Available)
    mockUpdateWorkerStatus.mockResolvedValue(WorkerStatus.Paused)

    render(<WorkerStatusButton />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Pause Downloads" })).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "Pause Downloads" }))

    await waitFor(() => {
      expect(mockUpdateWorkerStatus).toHaveBeenCalledWith(WorkerStatus.Paused)
    })
  })

  test("should call updateWorkerStatus to resume when currently paused", async () => {
    const user = userEvent.setup()
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Paused)
    mockUpdateWorkerStatus.mockResolvedValue(WorkerStatus.Available)

    render(<WorkerStatusButton />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Resume Downloads" })).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "Resume Downloads" }))

    await waitFor(() => {
      expect(mockUpdateWorkerStatus).toHaveBeenCalledWith(WorkerStatus.Available)
    })
  })

  test("should notify the user and revert the toggle on update failure", async () => {
    const user = userEvent.setup()
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const updateError = new Error("Update failed")
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Available)
    mockUpdateWorkerStatus.mockRejectedValue(updateError)

    render(<WorkerStatusButton />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Pause Downloads" })).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "Pause Downloads" }))

    await waitFor(() => {
      expect(consoleWarn).toHaveBeenCalledWith("Failed to update the worker status", updateError)
    })
    expect(screen.getByRole("button", { name: "Pause Downloads" })).toBeInTheDocument()

    consoleWarn.mockRestore()
  })
})
