import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import Header from "~/components/title-bar/Header"
import { createMemoryRouter, RouterProvider } from "react-router"
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

const renderWithProviders = () => {
  const contextValue = {
    safeMode: false,
    theme: Theme.Light,
    setSafeMode: vi.fn(),
    setTheme: vi.fn(),
  }

  const routes = [
    {
      path: "*",
      element: (
        <ApplicationConfigurationContext.Provider value={Some.of(contextValue)}>
          <Header />
        </ApplicationConfigurationContext.Provider>
      ),
    },
  ]
  const router = createMemoryRouter(routes, {
    initialEntries: ["/"],
  })

  return render(<RouterProvider router={router} />)
}

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchWorkerStatus.mockResolvedValue(WorkerStatus.Available)
  })

  test("should render logo image", async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByAltText("small logo")).toBeInTheDocument()
    })
  })

  test("should render 'Video Downloader' text", async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText("Video Downloader")).toBeInTheDocument()
    })
  })

  test("should render logo as a link to home", async () => {
    renderWithProviders()

    await waitFor(() => {
      const logoLink = screen.getByRole("link", { name: /small logo video downloader/i })
      expect(logoLink).toHaveAttribute("href", "/")
    })
  })

  test("should render Navigator component", async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText("Videos")).toBeInTheDocument()
      expect(screen.getByText("Schedule")).toBeInTheDocument()
    })
  })

  test("should render QuickSettings component", async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByLabelText("Dark Mode")).toBeInTheDocument()
    })
  })
})
