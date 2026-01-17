import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import QuickSettings from "~/components/quick-settings/QuickSettings"
import { Theme } from "~/models/ApplicationConfiguration"
import { ApplicationConfigurationContext } from "~/providers/ApplicationConfigurationProvider"
import { Some } from "~/types/Option"
import { WorkerStatus } from "~/models/WorkerStatus"
import React from "react"

vi.mock("~/services/scheduling/SchedulingService", () => ({
  fetchWorkerStatus: vi.fn(),
  updateWorkerStatus: vi.fn(),
}))

import { fetchWorkerStatus } from "~/services/scheduling/SchedulingService"

const mockFetchWorkerStatus = vi.mocked(fetchWorkerStatus)

const renderWithContext = () => {
  const contextValue = {
    safeMode: false,
    theme: Theme.Light,
    setSafeMode: vi.fn(),
    setTheme: vi.fn(),
  }

  return render(
    <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
      <QuickSettings />
    </ApplicationConfigurationContext.Provider>
  )
}

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

  test("should render all three icon buttons", async () => {
    renderWithContext()

    await waitFor(() => {
      expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument()
      expect(screen.getByLabelText("Enable safe mode")).toBeInTheDocument()
      expect(screen.getByLabelText("Pause workers")).toBeInTheDocument()
    })
  })
})
