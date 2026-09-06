import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ServiceInformation from "~/pages/authenticated/service-information/ServiceInformation"
import { createMemoryRouter, RouterProvider } from "react-router"
import { DateTime } from "luxon"
import { Some } from "~/types/Option"
import { HealthStatus } from "~/models/HealthCheck"
import React from "react"
import { buildBackendServiceInformation, buildHealthCheck } from "../fixtures"

const createMockBackendInfo = () =>
  buildBackendServiceInformation({
    serviceName: "video-downloader-backend",
    organization: "ruchira",
    javaVersion: "21.0.1",
    scalaVersion: "3.3.1",
    sbtVersion: "1.9.7",
    // The schema renames this to `ytDlpVersion`, so the fixture states the wire name.
    "yt-dlpVersion": "2024.01.01",
    currentTimestamp: "2024-01-15T10:30:00+00:00",
    gitBranch: "main",
    gitCommit: "abc1234",
    buildTimestamp: "2024-01-10T08:00:00+00:00"
  })

const healthy = (durationInMs: number) => ({ durationInMs, healthStatus: HealthStatus.Healthy })

const createMockHealthCheck = (allHealthy = true) =>
  buildHealthCheck({
    database: {
      durationInMs: 50,
      healthStatus: allHealthy ? HealthStatus.Healthy : HealthStatus.Unhealthy
    },
    keyValueStore: healthy(30),
    pubSub: healthy(25),
    spaRenderer: healthy(100),
    internetConnectivity: healthy(200),
    fileRepository: {
      imageFolder: { filePath: "/data/images", healthStatusDetails: healthy(10) },
      videoFolder: { filePath: "/data/videos", healthStatusDetails: healthy(15) },
      otherVideoFolders: [{ filePath: "/data/archive", healthStatusDetails: healthy(20) }]
    }
  })

vi.mock("~/services/health/HealthCheckService", () => ({
  retrieveBackendServiceInformation: vi.fn(),
  performHealthCheck: vi.fn(),
  frontendServiceInformation: vi.fn(),
}))

vi.mock("~/services/ApiConfiguration", () => ({
  apiConfiguration: {
    baseUrl: "https://api.example.com",
  },
}))

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>,
}))

const createMockFrontendInfo = () => ({
  name: "video-downloader-front-end",
  version: "1.0.0",
  timestamp: DateTime.fromISO("2024-01-15T10:30:00Z"),
  gitBranch: Some.of("main"),
  gitCommit: Some.of("def5678"),
  buildTimestamp: Some.of(DateTime.fromISO("2024-01-10T08:00:00Z")),
})

const renderWithRouter = () => {
  const router = createMemoryRouter([
    {
      path: "/",
      element: <ServiceInformation />,
    },
  ])

  return render(<RouterProvider router={router} />)
}

describe("ServiceInformation", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })

    const { retrieveBackendServiceInformation, performHealthCheck, frontendServiceInformation } =
      await import("~/services/health/HealthCheckService")

    vi.mocked(retrieveBackendServiceInformation).mockResolvedValue(createMockBackendInfo())
    vi.mocked(performHealthCheck).mockResolvedValue(createMockHealthCheck())
    vi.mocked(frontendServiceInformation).mockReturnValue(createMockFrontendInfo())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test("should render the page with Backend and Frontend section titles", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Backend")).toBeInTheDocument()
      expect(screen.getByText("Frontend")).toBeInTheDocument()
    })
  })

  test("should display the API URL", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("API URL:")).toBeInTheDocument()
      expect(screen.getByText("https://api.example.com")).toBeInTheDocument()
    })
  })

  test("should display backend service information", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Service Name:")).toBeInTheDocument()
      expect(screen.getByText("video-downloader-backend")).toBeInTheDocument()
      expect(screen.getByText("Organization:")).toBeInTheDocument()
      expect(screen.getByText("ruchira")).toBeInTheDocument()
      expect(screen.getByText("Java Version:")).toBeInTheDocument()
      expect(screen.getByText("21.0.1")).toBeInTheDocument()
      expect(screen.getByText("Scala Version:")).toBeInTheDocument()
      expect(screen.getByText("3.3.1")).toBeInTheDocument()
      expect(screen.getByText("sbt Version:")).toBeInTheDocument()
      expect(screen.getByText("1.9.7")).toBeInTheDocument()
      expect(screen.getByText("yt-dlp Version:")).toBeInTheDocument()
      expect(screen.getByText("2024.01.01")).toBeInTheDocument()
    })
  })

  test("should display frontend service information", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Name:")).toBeInTheDocument()
      expect(screen.getByText("video-downloader-front-end")).toBeInTheDocument()
      expect(screen.getByText("Version:")).toBeInTheDocument()
      expect(screen.getByText("1.0.0")).toBeInTheDocument()
    })
  })

  test("should display git information for backend and frontend", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getAllByText("Git Branch:").length).toBe(2)
      expect(screen.getAllByText("main").length).toBe(2)
      expect(screen.getAllByText("Git Commit:").length).toBe(2)
      expect(screen.getByText("abc1234")).toBeInTheDocument()
      expect(screen.getByText("def5678")).toBeInTheDocument()
    })
  })

  test("should display Health Checks section", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Health Checks")).toBeInTheDocument()
      expect(screen.getByText("Last Health Check:")).toBeInTheDocument()
    })
  })

  test("should display service health checks", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Services")).toBeInTheDocument()
      expect(screen.getByText("Database")).toBeInTheDocument()
      expect(screen.getByText("Key Value Store")).toBeInTheDocument()
      expect(screen.getByText("PubSub")).toBeInTheDocument()
      expect(screen.getByText("SPA Renderer")).toBeInTheDocument()
      expect(screen.getByText("Internet Connectivity")).toBeInTheDocument()
    })
  })

  test("should display file repository health checks", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("File Repository")).toBeInTheDocument()
      expect(screen.getByText("Image Folder")).toBeInTheDocument()
      expect(screen.getByText("/data/images")).toBeInTheDocument()
      expect(screen.getByText("Video Folder")).toBeInTheDocument()
      expect(screen.getByText("/data/videos")).toBeInTheDocument()
      expect(screen.getByText("Other Folders")).toBeInTheDocument()
      expect(screen.getByText("/data/archive")).toBeInTheDocument()
    })
  })

  test("should display healthy status for healthy services", async () => {
    renderWithRouter()

    await waitFor(() => {
      const healthyStatuses = screen.getAllByText("Healthy")
      expect(healthyStatuses.length).toBeGreaterThan(0)
    })
  })

  test("should display unhealthy status when a service is unhealthy", async () => {
    const { performHealthCheck } = await import("~/services/health/HealthCheckService")
    vi.mocked(performHealthCheck).mockResolvedValue(createMockHealthCheck(false))

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Unhealthy")).toBeInTheDocument()
    })
  })

  test("should display health check durations", async () => {
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("(50 ms)")).toBeInTheDocument()
      expect(screen.getByText("(30 ms)")).toBeInTheDocument()
      expect(screen.getByText("(25 ms)")).toBeInTheDocument()
    })
  })

  test("should show loading state for health checks initially", async () => {
    const { performHealthCheck } = await import("~/services/health/HealthCheckService")
    vi.mocked(performHealthCheck).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(createMockHealthCheck()), 1000))
    )

    renderWithRouter()

    expect(screen.getByText("Performing health checks...")).toBeInTheDocument()

    await act(async () => { vi.advanceTimersByTime(1000) })

    await waitFor(() => {
      expect(screen.queryByText("Performing health checks...")).not.toBeInTheDocument()
    })
  })

  test("should call retrieveBackendServiceInformation only once on mount", async () => {
    const { retrieveBackendServiceInformation } = await import("~/services/health/HealthCheckService")

    renderWithRouter()

    await waitFor(() => {
      expect(retrieveBackendServiceInformation).toHaveBeenCalledTimes(1)
    })

    await act(() => vi.advanceTimersByTimeAsync(5000))

    expect(retrieveBackendServiceInformation).toHaveBeenCalledTimes(1)
  })

  test("should call performHealthCheck on mount", async () => {
    const { performHealthCheck } = await import("~/services/health/HealthCheckService")

    renderWithRouter()

    await waitFor(() => {
      expect(performHealthCheck).toHaveBeenCalled()
    })
  })

  test("should not render Other Folders section when there are no other folders", async () => {
    const { performHealthCheck } = await import("~/services/health/HealthCheckService")
    vi.mocked(performHealthCheck).mockResolvedValue(
      buildHealthCheck({ fileRepository: { otherVideoFolders: [] } })
    )

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("File Repository")).toBeInTheDocument()
    })

    expect(screen.queryByText("Other Folders")).not.toBeInTheDocument()
  })

  test("should omit backend items whose value is absent", async () => {
    const { retrieveBackendServiceInformation } = await import("~/services/health/HealthCheckService")
    vi.mocked(retrieveBackendServiceInformation).mockResolvedValue(
      buildBackendServiceInformation({ gitBranch: null, gitCommit: null, buildTimestamp: null })
    )

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Service Name:")).toBeInTheDocument()
    })

    // Only the frontend still reports these.
    expect(screen.getAllByText("Git Branch:")).toHaveLength(1)
    expect(screen.getAllByText("Git Commit:")).toHaveLength(1)
    expect(screen.getAllByText("Build Timestamp:")).toHaveLength(1)
  })

  test("should keep the frontend section when backend information cannot be retrieved", async () => {
    const { retrieveBackendServiceInformation } = await import("~/services/health/HealthCheckService")
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(retrieveBackendServiceInformation).mockRejectedValue(new Error("backend down"))

    renderWithRouter()

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to retrieve backend service information",
        expect.any(Error)
      )
    })
    expect(screen.getByText("video-downloader-front-end")).toBeInTheDocument()
    expect(screen.queryByText("Service Name:")).not.toBeInTheDocument()

    consoleError.mockRestore()
  })

  test("should re-run the health check when the refresh button is clicked", async () => {
    const { performHealthCheck } = await import("~/services/health/HealthCheckService")
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Health Checks")).toBeInTheDocument()
    })
    expect(performHealthCheck).toHaveBeenCalledTimes(1)

    await user.click(screen.getByTestId("ReplayIcon").closest("button")!)

    await waitFor(() => {
      expect(performHealthCheck).toHaveBeenCalledTimes(2)
    })
    // The button is usable again once the check has finished.
    await waitFor(() => {
      expect(screen.getByTestId("ReplayIcon").closest("button")).toBeEnabled()
    })
  })

  test("should keep the last result and re-enable the refresh when a health check fails", async () => {
    const { performHealthCheck } = await import("~/services/health/HealthCheckService")
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.mocked(performHealthCheck)
      .mockResolvedValueOnce(createMockHealthCheck())
      .mockRejectedValueOnce(new Error("health check failed"))

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("Database")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("ReplayIcon").closest("button")!)

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith("Failed to perform the health check", expect.any(Error))
    })
    expect(screen.getByText("Database")).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId("ReplayIcon").closest("button")).toBeEnabled()
    })

    consoleError.mockRestore()
  })

  describe("API URL copy button", () => {
    // user-event installs its own clipboard stub on setup, so these tests click with fireEvent
    // and provide the clipboard themselves.
    const stubClipboard = (writeText: (text: string) => Promise<void>) =>
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })

    test("should copy the API URL and confirm it", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      stubClipboard(writeText)

      renderWithRouter()

      fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }))

      expect(writeText).toHaveBeenCalledWith("https://api.example.com")
      await waitFor(() => {
        expect(screen.getByTestId("CheckIcon")).toBeInTheDocument()
      })

      // The confirmation is transient: the copy icon returns after a short while.
      await act(async () => { vi.advanceTimersByTime(2000) })
      expect(screen.getByTestId("ContentCopyIcon")).toBeInTheDocument()
    })

    test("should log rather than throw when the clipboard is unavailable", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
      stubClipboard(vi.fn().mockRejectedValue(new Error("denied")))

      renderWithRouter()

      fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }))

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith("Failed to copy to clipboard", expect.any(Error))
      })
      expect(screen.getByTestId("ContentCopyIcon")).toBeInTheDocument()

      consoleError.mockRestore()
    })
  })
})
