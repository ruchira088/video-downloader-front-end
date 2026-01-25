import { beforeEach, describe, expect, test, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import ServiceInformation from "~/pages/authenticated/service-information/ServiceInformation"
import { createMemoryRouter, RouterProvider } from "react-router"
import { DateTime, Duration } from "luxon"
import { Some } from "~/types/Option"
import { HealthStatus } from "~/models/HealthCheck"
import React from "react"

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

const createMockBackendInfo = () => ({
  serviceName: "video-downloader-backend",
  organization: "ruchira",
  javaVersion: "21.0.1",
  scalaVersion: "3.3.1",
  sbtVersion: "1.9.7",
  ytDlpVersion: "2024.01.01",
  currentTimestamp: DateTime.fromISO("2024-01-15T10:30:00Z"),
  gitBranch: Some.of("main"),
  gitCommit: Some.of("abc1234"),
  buildTimestamp: Some.of(DateTime.fromISO("2024-01-10T08:00:00Z")),
})

const createMockFrontendInfo = () => ({
  name: "video-downloader-front-end",
  version: "1.0.0",
  timestamp: DateTime.fromISO("2024-01-15T10:30:00Z"),
  gitBranch: Some.of("main"),
  gitCommit: Some.of("def5678"),
  buildTimestamp: Some.of(DateTime.fromISO("2024-01-10T08:00:00Z")),
})

const createMockHealthCheck = (allHealthy = true) => ({
  database: {
    healthStatus: allHealthy ? HealthStatus.Healthy : HealthStatus.Unhealthy,
    duration: Duration.fromMillis(50),
  },
  keyValueStore: {
    healthStatus: HealthStatus.Healthy,
    duration: Duration.fromMillis(30),
  },
  pubSub: {
    healthStatus: HealthStatus.Healthy,
    duration: Duration.fromMillis(25),
  },
  spaRenderer: {
    healthStatus: HealthStatus.Healthy,
    duration: Duration.fromMillis(100),
  },
  internetConnectivity: {
    healthStatus: HealthStatus.Healthy,
    duration: Duration.fromMillis(200),
  },
  fileRepository: {
    imageFolder: {
      filePath: "/data/images",
      healthStatusDetails: {
        healthStatus: HealthStatus.Healthy,
        duration: Duration.fromMillis(10),
      },
    },
    videoFolder: {
      filePath: "/data/videos",
      healthStatusDetails: {
        healthStatus: HealthStatus.Healthy,
        duration: Duration.fromMillis(15),
      },
    },
    otherVideoFolders: [
      {
        filePath: "/data/archive",
        healthStatusDetails: {
          healthStatus: HealthStatus.Healthy,
          duration: Duration.fromMillis(20),
        },
      },
    ],
  },
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

    vi.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(screen.queryByText("Performing health checks...")).not.toBeInTheDocument()
    })
  })

  test("should call retrieveBackendServiceInformation on mount", async () => {
    const { retrieveBackendServiceInformation } = await import("~/services/health/HealthCheckService")

    renderWithRouter()

    await waitFor(() => {
      expect(retrieveBackendServiceInformation).toHaveBeenCalled()
    })
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
    const healthCheck = createMockHealthCheck()
    healthCheck.fileRepository.otherVideoFolders = []
    vi.mocked(performHealthCheck).mockResolvedValue(healthCheck)

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText("File Repository")).toBeInTheDocument()
    })

    expect(screen.queryByText("Other Folders")).not.toBeInTheDocument()
  })
})
