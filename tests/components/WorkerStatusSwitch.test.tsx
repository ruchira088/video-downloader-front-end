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

  test("should render with 'Workers' label", async () => {
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Available)

    render(<WorkerStatusSwitch />)

    await waitFor(() => {
      expect(screen.getByText("Workers")).toBeInTheDocument()
    })
  })

  test("should call updateWorkerStatus when clicked", async () => {
    const user = userEvent.setup()
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Available)
    mockUpdateWorkerStatus.mockResolvedValue(WorkerStatus.Paused)

    render(<WorkerStatusSwitch />)

    await waitFor(() => {
      expect(screen.getByLabelText("Workers")).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText("Workers"))

    await waitFor(() => {
      expect(mockUpdateWorkerStatus).toHaveBeenCalledWith(WorkerStatus.Paused)
    })
  })

  test("should update to Available when currently Paused", async () => {
    const user = userEvent.setup()
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Paused)
    mockUpdateWorkerStatus.mockResolvedValue(WorkerStatus.Available)

    render(<WorkerStatusSwitch />)

    await waitFor(() => {
      expect(screen.getByLabelText("Workers")).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText("Workers"))

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
      expect(screen.getByLabelText("Workers")).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText("Workers"))

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    })

    consoleError.mockRestore()
  })
})
