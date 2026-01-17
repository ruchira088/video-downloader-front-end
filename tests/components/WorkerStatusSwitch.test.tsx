import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import WorkerStatusSwitch from "~/components/quick-settings/switches/WorkerStatusSwitch"
import { WorkerStatus } from "~/models/WorkerStatus"

vi.mock("~/services/scheduling/SchedulingService", () => ({
  fetchWorkerStatus: vi.fn(),
  updateWorkerStatus: vi.fn(),
}))

import { fetchWorkerStatus, updateWorkerStatus } from "~/services/scheduling/SchedulingService"

const mockFetchWorkerStatus = vi.mocked(fetchWorkerStatus)
const mockUpdateWorkerStatus = vi.mocked(updateWorkerStatus)

describe("WorkerStatusSwitch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should render with workers toggle button", async () => {
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Available)

    render(<WorkerStatusSwitch />)

    await waitFor(() => {
      expect(screen.getByLabelText("Pause workers")).toBeInTheDocument()
    })
  })

  test("should call updateWorkerStatus to pause when currently available", async () => {
    const user = userEvent.setup()
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Available)
    mockUpdateWorkerStatus.mockResolvedValue(WorkerStatus.Paused)

    render(<WorkerStatusSwitch />)

    await waitFor(() => {
      expect(screen.getByLabelText("Pause workers")).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText("Pause workers"))

    await waitFor(() => {
      expect(mockUpdateWorkerStatus).toHaveBeenCalledWith(WorkerStatus.Paused)
    })
  })

  test("should call updateWorkerStatus to start when currently paused", async () => {
    const user = userEvent.setup()
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Paused)
    mockUpdateWorkerStatus.mockResolvedValue(WorkerStatus.Available)

    render(<WorkerStatusSwitch />)

    await waitFor(() => {
      expect(screen.getByLabelText("Start workers")).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText("Start workers"))

    await waitFor(() => {
      expect(mockUpdateWorkerStatus).toHaveBeenCalledWith(WorkerStatus.Available)
    })
  })

  test("should log error on update failure", async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Available)
    mockUpdateWorkerStatus.mockRejectedValue(new Error("Update failed"))

    render(<WorkerStatusSwitch />)

    await waitFor(() => {
      expect(screen.getByLabelText("Pause workers")).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText("Pause workers"))

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    })

    consoleError.mockRestore()
  })
})
