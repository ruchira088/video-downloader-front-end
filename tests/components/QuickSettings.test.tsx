import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import QuickSettings from "~/components/quick-settings/QuickSettings"
import { WorkerStatus } from "~/models/WorkerStatus"
import React from "react"
import { MemoryRouter } from "react-router"
import { withApplicationConfiguration } from "../helpers"

vi.mock("~/services/scheduling/SchedulingService", () => ({
  fetchWorkerStatus: vi.fn(),
  updateWorkerStatus: vi.fn(),
}))

vi.mock("~/services/authentication/AuthenticationService", () => ({
  logout: vi.fn(),
}))

import { fetchWorkerStatus } from "~/services/scheduling/SchedulingService"

const mockFetchWorkerStatus = vi.mocked(fetchWorkerStatus)

const renderWithContext = () =>
  render(<MemoryRouter>{withApplicationConfiguration(<QuickSettings />)}</MemoryRouter>)

describe("QuickSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Available)
  })

  test("should render ThemeSwitch", async () => {
    renderWithContext()

    await waitFor(() => {
      expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument()
    })
  })

  test("should render SafeModeSwitch", async () => {
    renderWithContext()

    await waitFor(() => {
      expect(screen.getByLabelText("Enable safe mode")).toBeInTheDocument()
    })
  })

  test("should render WorkerStatusSwitch", async () => {
    renderWithContext()

    await waitFor(() => {
      expect(screen.getByLabelText("Pause workers")).toBeInTheDocument()
    })
  })

  test("should render all four icon buttons", async () => {
    renderWithContext()

    await waitFor(() => {
      expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument()
      expect(screen.getByLabelText("Enable safe mode")).toBeInTheDocument()
      expect(screen.getByLabelText("Pause workers")).toBeInTheDocument()
      expect(screen.getByLabelText("Logout")).toBeInTheDocument()
    })
  })

  test("should render LogoutButton", async () => {
    renderWithContext()

    await waitFor(() => {
      expect(screen.getByLabelText("Logout")).toBeInTheDocument()
    })
  })
})
