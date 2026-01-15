import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Schedule from "~/pages/authenticated/schedule/Schedule"
import { DateTime, Duration } from "luxon"
import { FileResourceType } from "~/models/FileResource"
import { SchedulingStatus } from "~/models/SchedulingStatus"
import { None } from "~/types/Option"
import React from "react"

vi.mock("~/services/scheduling/SchedulingService", () => ({
  scheduleVideo: vi.fn(),
}))

const createMockScheduledVideoDownload = () => ({
  lastUpdatedAt: DateTime.now(),
  scheduledAt: DateTime.now(),
  videoMetadata: {
    url: "https://example.com/video",
    id: "video-123",
    videoSite: "youtube",
    title: "Test Video",
    duration: Duration.fromObject({ minutes: 5 }),
    size: 1024000000,
    thumbnail: {
      id: "thumb-123",
      type: FileResourceType.Thumbnail as const,
      createdAt: DateTime.now(),
      path: "/path/to/thumb",
      mediaType: "image/jpeg",
      size: 1024,
    },
  },
  status: SchedulingStatus.Queued,
  downloadedBytes: 0,
  completedAt: None.of<DateTime>(),
  errorInfo: null,
})

vi.mock("~/components/helmet/Helmet", () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>,
}))

vi.mock("~/components/schedule/preview/Preview", () => ({
  default: ({ url }: { url: string }) => <div data-testid="preview">Preview: {url}</div>,
}))

describe("Schedule", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { scheduleVideo } = await import("~/services/scheduling/SchedulingService")
    vi.mocked(scheduleVideo).mockResolvedValue(createMockScheduledVideoDownload())
  })

  test("should render schedule page with title", () => {
    render(<Schedule />)

    expect(screen.getByLabelText("Website URL")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Schedule Download" })).toBeInTheDocument()
  })

  test("should update input value on change", () => {
    render(<Schedule />)

    const input = screen.getByLabelText("Website URL")
    fireEvent.change(input, { target: { value: "https://example.com/video" } })

    expect(input).toHaveValue("https://example.com/video")
  })

  test("should show preview component with URL", () => {
    render(<Schedule />)

    const input = screen.getByLabelText("Website URL")
    fireEvent.change(input, { target: { value: "https://example.com/video" } })

    expect(screen.getByTestId("preview")).toHaveTextContent("Preview: https://example.com/video")
  })

  test("should call scheduleVideo and clear input on button click", async () => {
    const { scheduleVideo } = await import("~/services/scheduling/SchedulingService")

    render(<Schedule />)

    const input = screen.getByLabelText("Website URL")
    fireEvent.change(input, { target: { value: "https://example.com/video" } })

    const button = screen.getByRole("button", { name: "Schedule Download" })
    fireEvent.click(button)

    await waitFor(() => {
      expect(scheduleVideo).toHaveBeenCalledWith("https://example.com/video")
    })

    await waitFor(() => {
      expect(input).toHaveValue("")
    })
  })

  test("should show progress bar while scheduling", async () => {
    const { scheduleVideo } = await import("~/services/scheduling/SchedulingService")
    let resolveSchedule: () => void
    vi.mocked(scheduleVideo).mockImplementation(() => new Promise(resolve => {
      resolveSchedule = () => resolve(createMockScheduledVideoDownload())
    }))

    render(<Schedule />)

    const input = screen.getByLabelText("Website URL")
    fireEvent.change(input, { target: { value: "https://example.com/video" } })

    const button = screen.getByRole("button", { name: "Schedule Download" })
    fireEvent.click(button)

    expect(screen.getByRole("progressbar")).toBeInTheDocument()

    resolveSchedule!()

    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    })
  })
})
